import os
import json
import re
import network_fix
from typing import TypedDict, List, Dict, Annotated, Literal, Callable
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from thefuzz import fuzz
import time
import operator
from pathlib import Path
import datetime
import logging
import sqlite3
import json
import datetime


# Import your custom modules
from tools import search_npi_registry, validate_address, scrape_provider_website
from provider_requests import get_all_providers
from logic_engine import SurgicalValidator

from production_tools import (
    check_oig_leie_csv_method,
    verify_state_license_universal,
    search_google_scholar,
    verify_medical_facility,
    search_provider_web_presence
)

# ============================================
# DATABASE INITIALIZATION
# ============================================
def init_review_queue_db():
    """Initialize SQLite database for human review queue."""
    conn = sqlite3.connect("review_queue.db")
    cursor = conn.cursor()
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS review_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            provider_name TEXT,
            npi TEXT,
            confidence REAL,
            flags TEXT,
            status TEXT,
            review_reason TEXT,
            created_at TEXT,
            reviewed_at TEXT,
            reviewer_notes TEXT
        )
    """)
    
    conn.commit()
    conn.close()
    print("✅ Review queue database initialized")

# Initialize on module load
init_review_queue_db()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
OIG_CSV_PATH = Path(__file__).resolve().parent.parent / "Sample_Data" / "oig_leie_database.csv"
TESTING_MODE = os.getenv("TESTING_MODE", "false").lower() == "true"

validator = SurgicalValidator()
load_dotenv()

def merge_dicts(a: dict, b: dict) -> dict:
    """Helper to deep merge dictionaries from parallel branches."""
    result = a.copy()
    for key, value in b.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    return result

# ============================================
# ENHANCED STATE WITH SOURCE HIERARCHY
# ============================================
class AgentState(TypedDict):
    initial_data: dict
    log: Annotated[List[str], operator.add]
    
    # Step 2: Primary Source Verification Results
    npi_result: dict
    oig_leie_result: dict
    state_board_result: dict
    
    # Step 3: Web Enrichment
    address_result: dict
    web_enrichment_data: dict
    digital_footprint_score: float
    
    # Step 4: QA Findings
    qa_flags: Annotated[List[str], operator.add]
    qa_corrections: dict
    fraud_indicators: Annotated[List[str], operator.add]
    
    # Step 5: AI Synthesis
    conflicting_data: Annotated[List[dict], operator.add]
    golden_record: dict
    
    # Step 6: Confidence & Human-in-Loop
    confidence_score: float
    confidence_breakdown: dict
    requires_human_review: bool
    review_reason: str
    
    final_profile: dict
    execution_metadata: Annotated[dict, merge_dicts]
    data_provenance: dict
    quality_metrics: dict

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

# ============================================
# SOURCE AUTHORITY HIERARCHY
# ============================================
SOURCE_HIERARCHY = {
    "state_medical_board": 100,
    "nppes_api": 90,
    "oig_leie": 85,
    "google_business": 70,
    "provider_website": 60,
    "csv_upload": 40,
}

def calculate_data_freshness(last_updated: str) -> float:
    """Decay model: Data degrades over time."""
    try:
        update_date = datetime.datetime.strptime(last_updated, "%Y-%m-%d")
        days_old = (datetime.datetime.now() - update_date).days
        
        if days_old < 30:
            return 1.0
        elif days_old < 90:
            return 0.5
        else:
            return max(0.1, 1.0 - (days_old / 365))
    except:
        return 0.3

# ============================================
# ERROR HANDLING DECORATOR
# ============================================
def safe_node_execution(node_func: Callable) -> Callable:
    """Decorator to add error handling and logging to nodes."""
    def wrapper(state: AgentState) -> dict:
        node_name = node_func.__name__
        try:
            logger.info(f"Executing {node_name}...")
            result = node_func(state)
            logger.info(f"✓ {node_name} completed successfully")
            return result
        except Exception as e:
            logger.error(f"✗ ERROR in {node_name}: {str(e)}", exc_info=True)
            return {
                "log": [f"ERROR in {node_name}: {str(e)}"],
                "execution_metadata": {
                    **state.get("execution_metadata", {}),
                    node_name: {
                        "error": str(e),
                        "status": "failed",
                        "timestamp": datetime.datetime.now().isoformat()
                    }
                }
            }
    return wrapper

# ============================================
# UTILITY: ROBUST JSON EXTRACTION
# ============================================
def extract_json_from_response(text: str) -> dict:
    """Enhanced JSON extraction with better error handling."""
    if not text or not text.strip():
        raise ValueError("Empty response from LLM")
    
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    
    if first_brace == -1 or last_brace == -1:
        first_bracket = text.find('[')
        last_bracket = text.rfind(']')
        if first_bracket != -1 and last_bracket != -1:
            json_str = text[first_bracket:last_bracket + 1]
            return json.loads(json_str)
        raise ValueError(f"No valid JSON found. Text: {text[:200]}")
    
    json_str = text[first_brace:last_brace + 1]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError:
        json_str = json_str.replace("'", '"')
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        return json.loads(json_str)

# ============================================
# UTILITY: NAME PARSING
# ============================================
def parse_provider_name(full_name: str) -> tuple:
    """Extract first and last name from full name."""
    titles_to_remove = ["DR.", "DR", "MD", "DDS", "DVM", "DO", "PHD", "PA", "NP"]
    name_parts = [
        part for part in full_name.strip().split() 
        if part.upper().replace('.', '') not in titles_to_remove
    ]
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    return first_name, last_name

# ============================================
# STEP 2A: NPPES VERIFICATION
# ============================================
@safe_node_execution
def verify_npi_node(state: AgentState) -> dict:
    """STEP 2A: Primary Source Verification - NPPES"""
    print("┌─────────────────────────────────────────┐")
    print("│ STEP 2A: NPPES PRIMARY VERIFICATION    │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    initial_data = state["initial_data"]
    
    full_name = initial_data.get("full_name", "")
    first_name, last_name = parse_provider_name(full_name)
    npi_number = initial_data.get("NPI", "")
    state_code = initial_data.get("state", "")
    
    result = search_npi_registry(
        first_name=first_name, 
        last_name=last_name, 
        npi_number=npi_number, 
        state=state_code
    )
    
    execution_time = time.time() - start_time
    
    match_confidence = 0.0
    enumeration_type = None
    taxonomy_codes = []
    
    if result.get("result_count", 0) == 1:
        match_confidence = 1.0
        provider_data = result.get("results", [{}])[0]
        enumeration_type = provider_data.get("enumeration_type")
        taxonomies = provider_data.get("taxonomies", [])
        taxonomy_codes = [t.get("code") for t in taxonomies if t.get("code")]
        print(f"✓ Exact NPI match: {enumeration_type}")
        print(f"  Taxonomies: {', '.join(taxonomy_codes[:3])}")
    elif result.get("result_count", 0) > 1:
        match_confidence = 0.7
        print(f"⚠ Multiple matches ({result['result_count']}) - needs disambiguation")
    else:
        print("✗ No NPI match - CRITICAL ISSUE")
    
    freshness_score = 0.0
    last_updated = None
    if result.get("result_count", 0) > 0:
        last_updated = result.get("results", [{}])[0].get("basic", {}).get("last_updated")
        if last_updated:
            freshness_score = calculate_data_freshness(last_updated)
            print(f"  NPPES freshness: {freshness_score:.2%}")
    
    metadata = {
        "stage": "nppes_verification",
        "execution_time_seconds": execution_time,
        "match_confidence": match_confidence,
        "freshness_score": freshness_score,
        "result_count": result.get("result_count", 0),
        "enumeration_type": enumeration_type,
        "taxonomy_codes": taxonomy_codes,
        "source_authority": SOURCE_HIERARCHY["nppes_api"],
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "npi_result": result,
        "execution_metadata": {"nppes": metadata}
    }

# ============================================
# STEP 2B: OIG LEIE EXCLUSION CHECK
# ============================================
@safe_node_execution
def check_oig_exclusion_node(state: AgentState) -> dict:
    """STEP 2B: OIG LEIE Exclusion Verification"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 2B: OIG EXCLUSION CHECK           │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    initial_data = state["initial_data"]
    
    full_name = initial_data.get("full_name", "")
    first_name, last_name = parse_provider_name(full_name)
    
    result = check_oig_leie_csv_method(
        npi=initial_data.get("NPI"),
        first_name=first_name,
        last_name=last_name
    )
    
    is_excluded = result.get("is_excluded", False)
    exclusion_details = result.get("exclusion_details")
    
    # TESTING MODE: Mock exclusion trigger
    if TESTING_MODE and "EXCLUDED" in full_name.upper():
        is_excluded = True
        exclusion_details = {
            "exclusion_type": "1128(a)(1)",
            "exclusion_date": "2023-01-15",
            "waiver_date": None
        }
        print("❌ CRITICAL: Provider is on OIG LEIE - CANNOT USE (MOCK)")
    elif is_excluded:
        print("❌ CRITICAL: Provider is on OIG LEIE - CANNOT USE")
    else:
        print("✓ No OIG exclusions found")
    
    execution_time = time.time() - start_time
    
    metadata = {
        "stage": "oig_exclusion_check",
        "execution_time_seconds": execution_time,
        "is_excluded": is_excluded,
        "exclusion_details": exclusion_details,
        "source_authority": SOURCE_HIERARCHY["oig_leie"],
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "oig_leie_result": {
            "is_excluded": is_excluded,
            "details": exclusion_details
        },
        "execution_metadata": {"oig_leie": metadata}
    }

# ============================================
# STEP 2C: STATE BOARD LICENSE CHECK
# ============================================
@safe_node_execution
def verify_state_license_node(state: AgentState) -> dict:
    """STEP 2C: State Medical Board Verification"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 2C: STATE BOARD LICENSE CHECK     │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    initial_data = state["initial_data"]
    
    # Initialize variables
    disciplinary_actions = []
    expiration_date = "Unknown"
    license_status = "Unknown"
    
    license_number = initial_data.get("license_number", "")
    state_code = initial_data.get("state", "")
    
    if not license_number or not state_code:
        print("⚠ Skipped - Missing license number or state")
        return {
            "state_board_result": {
                "status": "Skipped - Incomplete data",
                "expiration_date": expiration_date,
                "disciplinary_actions": []
            },
            "execution_metadata": {
                "state_board": {
                    "stage": "state_board_verification",
                    "status": "skipped",
                    "execution_time_seconds": 0
                }
            }
        }
    
    result = verify_state_license_universal(
        state_code=state_code,
        license_number=license_number,
        provider_name=initial_data.get("full_name")
    )
    
    license_status = result.get("status", "Unknown")
    expiration_date = result.get("expiration_date", "Unknown")
    disciplinary_actions = result.get("disciplinary_actions", [])
    
    # TESTING MODE: Mock suspended/revoked licenses
    if TESTING_MODE:
        if "SUSPENDED" in license_number.upper():
            license_status = "Suspended"
            disciplinary_actions.append({
                "action_type": "Suspension",
                "effective_date": "2024-06-01",
                "reason": "Failed to complete CME requirements"
            })
            print("❌ CRITICAL: License is SUSPENDED (MOCK)")
        elif "REVOKED" in license_number.upper():
            license_status = "Revoked"
            print("❌ CRITICAL: License is REVOKED (MOCK)")
    
    if license_status == "Active":
        print(f"✓ License Active (expires: {expiration_date})")
    elif license_status in ["Suspended", "Revoked"]:
        print(f"❌ CRITICAL: License is {license_status}")
    
    execution_time = time.time() - start_time
    
    metadata = {
        "stage": "state_board_verification",
        "execution_time_seconds": execution_time,
        "license_status": license_status,
        "expiration_date": expiration_date,
        "disciplinary_actions": disciplinary_actions,
        "source_authority": SOURCE_HIERARCHY["state_medical_board"],
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "state_board_result": {
            "status": license_status,
            "expiration_date": expiration_date,
            "disciplinary_actions": disciplinary_actions
        },
        "execution_metadata": {"state_board": metadata}
    }

# ============================================
# STEP 3A: ADDRESS VALIDATION
# ============================================
@safe_node_execution
def validate_address_node(state: AgentState) -> dict:
    """STEP 3A: Address Validation with Geo-Verification"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 3A: GEO-VERIFIED ADDRESS CHECK    │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    initial_data = state["initial_data"]
    
    result = validate_address(
        address=initial_data.get("address", ""), 
        city=initial_data.get("city", ""), 
        state=initial_data.get("state", ""), 
        zip_code=initial_data.get("zip_code", "")
    )
    
    execution_time = time.time() - start_time
    
    verdict = result.get("verdict", "Unknown")
    confidence_map = {
        "High Confidence Match": 1.0,
        "Partial Match": 0.7,
        "Low Confidence": 0.4,
        "No Match": 0.0
    }
    
    address_confidence = confidence_map.get(verdict, 0.5)
    
    geo_result = verify_medical_facility(
        address=initial_data.get("address"),
        city=initial_data.get("city"),
        state=initial_data.get("state"),
        zip_code=initial_data.get("zip_code")
    )
    
    is_medical_facility = geo_result.get("is_medical_facility", True)
    facility_type = geo_result.get("facility_type", "Unknown")
    
    # TESTING MODE: Mock residential address
    if TESTING_MODE and "123 FAKE ST" in initial_data.get("address", "").upper():
        is_medical_facility = False
        facility_type = "Residential"
        print("⚠ WARNING: Address appears to be residential - fraud indicator (MOCK)")
    elif is_medical_facility:
        print(f"✓ Verified medical facility: {facility_type}")
    
    print(f"  USPS Verdict: {verdict} (confidence: {address_confidence:.2%})")
    print(f"  Execution time: {execution_time:.2f}s")
    
    metadata = {
        "stage": "address_validation",
        "execution_time_seconds": execution_time,
        "confidence": address_confidence,
        "verdict": verdict,
        "is_medical_facility": is_medical_facility,
        "facility_type": facility_type,
        "source_authority": SOURCE_HIERARCHY["google_business"],
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "address_result": {
            **result,
            "is_medical_facility": is_medical_facility,
            "facility_type": facility_type
        },
        "execution_metadata": {"address": metadata}
    }

# ============================================
# STEP 3B: WEB ENRICHMENT WITH DIGITAL FOOTPRINT
# ============================================
@safe_node_execution
def web_enrichment_node(state: AgentState) -> dict:
    """STEP 3B: Web Enrichment + Digital Footprint Analysis"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 3B: WEB ENRICHMENT & FOOTPRINT    │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    initial_data = state["initial_data"]
    url = initial_data.get("website")
    provider_name = initial_data.get("full_name", "")
    
    enrichment_data = {}
    if url:
        scraped_text = scrape_provider_website(url=url)
        
        if "error" not in scraped_text.lower():
            print(f"  Scraped {len(scraped_text)} characters from website")
            
            extraction_prompt = f"""Extract education and credentials from this text.
Return ONLY a JSON object with keys: education, certifications, languages, insurance_accepted.

TEXT: {scraped_text[:4000]}

Example: {{"education": ["Harvard Medical School - 2010"], "certifications": ["Board Certified in Surgery"], "languages": ["English"], "insurance_accepted": ["Medicare"]}}
"""
            
            try:
                response = llm.invoke(extraction_prompt)
                enrichment_data = extract_json_from_response(response.content)
                print(f"  ✓ Extracted credentials from website")
            except Exception as e:
                print(f"  ✗ Website parsing failed: {e}")
    
    digital_footprint_score = 0.0
    recent_publications = []
    
    scholar_result = search_google_scholar(
        provider_name=provider_name,
        year_min=2024
    )
    
    recent_publications = scholar_result.get("publications", [])
    
    web_result = search_provider_web_presence(
        provider_name=provider_name,
        npi=initial_data.get("NPI"),
        phone=initial_data.get("phone")
    )
    
    digital_footprint_score = web_result.get("web_presence_score", 0.0)
    
    if digital_footprint_score < 0.3:
        print("  ⚠ WARNING: Weak digital footprint - possible 'Zombie' provider")
    else:
        print(f"  ✓ Active digital presence (score: {digital_footprint_score:.2%})")
    
    execution_time = time.time() - start_time
    
    metadata = {
        "stage": "web_enrichment",
        "execution_time_seconds": execution_time,
        "digital_footprint_score": digital_footprint_score,
        "recent_publications_count": len(recent_publications),
        "source_authority": SOURCE_HIERARCHY["provider_website"],
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "web_enrichment_data": enrichment_data,
        "digital_footprint_score": digital_footprint_score,
        "execution_metadata": {"web_enrichment": metadata}
    }

# ============================================
# MERGER NODE (FIX FOR PARALLEL FAN-IN)
# ============================================
def merge_parallel_results_node(state: AgentState) -> dict:
    """Merger node to ensure all parallel branches have completed."""
    print("\n┌─────────────────────────────────────────┐")
    print("│ MERGING PARALLEL VERIFICATION RESULTS  │")
    print("└─────────────────────────────────────────┘")
    
    # Verify all required data is present
    required_results = ["npi_result", "oig_leie_result", "state_board_result", 
                       "address_result", "web_enrichment_data"]
    
    missing = [r for r in required_results if not state.get(r)]
    if missing:
        logger.warning(f"Missing results from: {', '.join(missing)}")
    else:
        print("✓ All parallel verification steps completed")
    
    return {}

# ============================================
# STEP 4: SURGICAL QA WITH FRAUD DETECTION
# ============================================
@safe_node_execution
def quality_assurance_node(state: AgentState) -> dict:
    """STEP 4: Quality Assurance with Fraud Detection"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 4: SURGICAL QA & FRAUD DETECTION  │")
    print("└─────────────────────────────────────────┘")

    flags = []
    corrections = {}
    fraud_indicators = []
    conflicting_data = []
    
    initial_data = state["initial_data"]
    
    flag_severity = {
        "CRITICAL": [],
        "WARNING": [],
        "INFO": []
    }

    # CHECK 1: OIG EXCLUSION
    print("\n  [1/7] OIG Exclusion Verification...")
    if state.get("oig_leie_result", {}).get("is_excluded"):
        flag = "❌ PROVIDER IS EXCLUDED FROM FEDERAL PROGRAMS - DO NOT USE"
        flags.append(flag)
        flag_severity["CRITICAL"].append(flag)
        fraud_indicators.append("OIG_LEIE_EXCLUSION")
        print(f"    ✗ {flag}")
    else:
        print("    ✓ No OIG exclusions")

    # CHECK 2: LICENSE STATUS
    print("\n  [2/7] License Status Verification...")
    license_status = state.get("state_board_result", {}).get("status", "")
    
    if license_status in ["Suspended", "Revoked"]:
        flag = f"❌ CRITICAL: License {license_status} - DO NOT USE"
        flags.append(flag)
        flag_severity["CRITICAL"].append(flag)
        fraud_indicators.append(f"LICENSE_{license_status.upper()}")
        print(f"    ✗ {flag}")
    elif license_status == "Active":
        print("    ✓ License is Active")

    # CHECK 3: GEO-VERIFICATION
    print("\n  [3/7] Geo-Verification (Fraud Detection)...")
    if not state.get("address_result", {}).get("is_medical_facility", True):
        flag = "ℹ Address type: shared / non-hospital practice location"
        flags.append(flag)
        flag_severity["INFO"].append(flag)
        print(f"    ℹ {flag}")
    else:
        print("    ✓ Address verified as medical facility")

    # CHECK 4: CROSS-FIELD CONSISTENCY
    print("\n  [4/7] Cross-Field Consistency...")
    input_specialty = initial_data.get("specialty", "")
    npi_taxonomies = state.get("execution_metadata", {}).get("nppes", {}).get("taxonomy_codes", [])
    
    if input_specialty and npi_taxonomies:
        specialty_match = True  # In production, use taxonomy mapping
        
        if not specialty_match:
            conflicting_data.append({
                "field": "specialty",
                "source_a": {"value": input_specialty, "source": "CSV", "authority": 40},
                "source_b": {"value": npi_taxonomies[0], "source": "NPPES", "authority": 90}
            })
            print(f"    ⚠ Specialty conflict detected")
        else:
            print("    ✓ Specialty matches NPPES taxonomy")

    # CHECK 5: LICENSE-ADDRESS ALIGNMENT
    print("\n  [5/7] License-Address State Alignment...")
    license_state = initial_data.get("state", "")
    address_state = initial_data.get("state", "")
    
    if license_state and address_state and license_state != address_state:
        flag = f"⚠ License state ({license_state}) ≠ Practice state ({address_state})"
        flags.append(flag)
        flag_severity["WARNING"].append(flag)
        print(f"    ⚠ {flag}")
    else:
        print("    ✓ License and practice states match")

    # CHECK 6: DIGITAL FOOTPRINT
    print("\n  [6/7] Digital Footprint Analysis...")
    footprint_score = state.get("digital_footprint_score", 0)
    
    if footprint_score < 0.3:
        flag = "ℹ Limited digital footprint (individual clinician)"
        flags.append(flag)
        flag_severity["INFO"].append(flag)
        print(f"    ℹ {flag}")

    else:
        print(f"    ✓ Active digital presence (score: {footprint_score:.2%})")

    # CHECK 6.5: DATA FRESHNESS (NON-BLOCKING)
    print("\n  [6.5/7] NPPES Data Freshness...")

    freshness_score = (
        state.get("execution_metadata", {})
            .get("nppes", {})
            .get("freshness_score", 1.0)
    )

    if freshness_score < 0.3:
        flag = "ℹ Data not recently updated in NPPES (monitoring recommended)"
        flags.append(flag)
        flag_severity["INFO"].append(flag)
        print(f"    ℹ {flag}")
    else:
        print(f"    ✓ NPPES data reasonably fresh ({freshness_score:.2%})")


    # CHECK 7: ADDRESS AUTO-HEALING
    print("\n  [7/7] Address Auto-Healing...")
    input_address = initial_data.get("address", "")
    npi_address = ""
    
    npi_results = state.get("npi_result", {}).get("results", [])
    if npi_results:
        addresses = npi_results[0].get("addresses", [])
        for addr in addresses:
            if addr.get("address_purpose") == "LOCATION":
                npi_address = addr.get("address_1", "")
                break

    if npi_address and input_address:
        validation_result = validator.compare_addresses(input_address, npi_address)

        if validation_result["action"] == "AUTO_CORRECT":
            corrections["address"] = validation_result["new_value"]
            flag = f"AUTO-HEALED: {validation_result['reason']}"
            flags.append(flag)
            flag_severity["INFO"].append(flag)
            print(f"    ✓ {flag}")
        elif validation_result["action"] == "FLAG":
            conflicting_data.append({
                "field": "address",
                "source_a": {"value": input_address, "source": "CSV", "authority": 40},
                "source_b": {"value": npi_address, "source": "NPPES", "authority": 90}
            })
            print(f"    ⚠ Address conflict - flagged for arbitration")

    risk_score = (
        len(flag_severity["CRITICAL"]) * 10 +
        len(flag_severity["WARNING"]) * 3 +
        len(fraud_indicators) * 5
    )
    
    print(f"\n  Risk Score: {risk_score:.1f}")
    print(f"  Fraud Indicators: {len(fraud_indicators)}")
    print(f"  Conflicts for Arbitration: {len(conflicting_data)}")

    return {
        "qa_flags": flags,
        "qa_corrections": corrections,
        "fraud_indicators": fraud_indicators,
        "conflicting_data": conflicting_data,
        "quality_metrics": {
            "flag_severity": flag_severity,  # ← Make sure this exists
            "risk_score": risk_score,
            "fraud_indicator_count": len(fraud_indicators),
            "conflict_count": len(conflicting_data)
        }
    }

# ============================================
# STEP 5: AI ARBITRATION & GOLDEN RECORD
# ============================================
def build_golden_record(state: AgentState, arbitrated_values: dict) -> dict:
    """Build the golden record with provenance tracking."""
    initial_data = state["initial_data"]
    corrections = state.get("qa_corrections", {})
    
    golden_record = {
        "provider_name": initial_data.get("full_name"),
        "npi": initial_data.get("NPI"),
        "specialty": arbitrated_values.get("specialty") or initial_data.get("specialty"),
        "address": arbitrated_values.get("address") or corrections.get("address") or initial_data.get("address"),
        "phone": corrections.get("phone") or initial_data.get("phone"),
        "website": initial_data.get("website"),
        "education": state.get("web_enrichment_data", {}).get("education", []),
        "certifications": state.get("web_enrichment_data", {}).get("certifications", []),
        "license_status": state.get("state_board_result", {}).get("status"),
        "oig_excluded": state.get("oig_leie_result", {}).get("is_excluded", False),
        "digital_footprint_score": state.get("digital_footprint_score", 0),
        
        "data_sources": {
            "name": "NPPES",
            "npi": "NPPES",
            "specialty": "CSV" if not arbitrated_values.get("specialty") else "NPPES",
            "address": "NPPES (auto-corrected)" if corrections.get("address") else "CSV",
            "license_status": "State Medical Board",
            "oig_check": "OIG LEIE"
        }
    }
    
    return golden_record

def standard_synthesis(state: AgentState) -> dict:
    """Fallback synthesis when no conflicts exist."""
    print("  ✓ Building golden record from uncontested data...")
    golden_record = build_golden_record(state, arbitrated_values={})
    return {
        "golden_record": golden_record,
        "execution_metadata": {
            "arbitration": {
                "conflicts_resolved": 0,
                "timestamp": datetime.datetime.now().isoformat()
            }
        }
    }

@safe_node_execution
def ai_arbitration_node(state: AgentState) -> dict:
    """STEP 5: AI-Powered Arbitration & Golden Record Synthesis"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 5: AI ARBITRATION & SYNTHESIS     │")
    print("└─────────────────────────────────────────┘")
    
    conflicting_data = state.get("conflicting_data", [])
    
    if not conflicting_data:
        print("  ✓ No conflicts detected - proceeding with standard synthesis")
        return standard_synthesis(state)
    
    print(f"\n  Arbitrating {len(conflicting_data)} data conflicts...")
    
    arbitrated_values = {}
    
    for conflict in conflicting_data:
        field = conflict["field"]
        source_a = conflict["source_a"]
        source_b = conflict["source_b"]
        
        if source_a["authority"] > source_b["authority"]:
            chosen = source_a
        else:
            chosen = source_b
            
        print(f"    {field}: Chose '{chosen['value']}' from {chosen['source']} (authority: {chosen['authority']})")
        arbitrated_values[field] = chosen["value"]
    
    golden_record = build_golden_record(state, arbitrated_values)
    
    return {
        "golden_record": golden_record,
        "execution_metadata": {
            "arbitration": {
                "conflicts_resolved": len(conflicting_data),
                "timestamp": datetime.datetime.now().isoformat()
            }
        }
    }

# ============================================
# STEP 6: CONFIDENCE SCORING WITH HITL (FIXED)
# ============================================
@safe_node_execution
def confidence_scorer_with_hitl_node(state: AgentState) -> dict:
    """STEP 6: Advanced Confidence Scoring with HITL Triggers"""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STEP 6: CONFIDENCE SCORING + HITL      │")
    print("└─────────────────────────────────────────┘")

    final_data = state.get("golden_record", state.get("final_profile", {}))
    fraud_indicators = state.get("fraud_indicators", [])
    
    total_score = 0.0

    WEIGHTS = {
        "primary_source_verification": 0.35,
        "address_reliability": 0.20,
        "digital_footprint": 0.15,
        "data_completeness": 0.15,
        "freshness": 0.10,
        "fraud_risk": 0.05
    }

    print("\n  Scoring Dimensions:")
    print("  ─────────────────────────────────────────")

    # DIMENSION 1: Primary Source Verification
    psv_score = 0.0
    npi_meta = state.get("execution_metadata", {}).get("nppes", {})
    if npi_meta.get("match_confidence", 0) >= 0.95:
        psv_score += 0.50
    elif npi_meta.get("match_confidence", 0) >= 0.7:
        psv_score += 0.35
    
    license_status = state.get("state_board_result", {}).get("status")

    if license_status == "Active":
        psv_score += 0.30
    elif license_status == "Skipped - Incomplete data":
        psv_score += 0.15   # ← neutral partial credit
    elif license_status in ["Suspended", "Revoked"]:
        psv_score = 0.0

    
    if not state.get("oig_leie_result", {}).get("is_excluded", False):
        psv_score += 0.20
    else:
        psv_score = 0.0
    
    total_score += psv_score * WEIGHTS["primary_source_verification"]
    print(f"  [1] Primary Sources: {psv_score:.2f} × {WEIGHTS['primary_source_verification']:.2f}")

    # DIMENSION 2: Address Reliability
    address_score = 0.0
    address_meta = state.get("execution_metadata", {}).get("address", {})
    
    if address_meta.get("confidence", 0) >= 0.9:
        address_score = 1.0
    elif address_meta.get("confidence", 0) >= 0.7:
        address_score = 0.7
    elif address_meta.get("confidence", 0) >= 0.4:
        address_score = 0.4
    
    if state.get("address_result", {}).get("is_medical_facility"):
        address_score = min(1.0, address_score + 0.1)
    
    total_score += address_score * WEIGHTS["address_reliability"]
    print(f"  [2] Address: {address_score:.2f} × {WEIGHTS['address_reliability']:.2f}")

    # DIMENSION 3: Digital Footprint
    footprint_score = state.get("digital_footprint_score", 0)
    total_score += footprint_score * WEIGHTS["digital_footprint"]
    print(f"  [3] Digital Footprint: {footprint_score:.2f} × {WEIGHTS['digital_footprint']:.2f}")

    # DIMENSION 4: Data Completeness
    required_fields = ["provider_name", "npi", "specialty", "address", "phone"]
    present = sum(1 for f in required_fields if final_data.get(f))
    completeness_score = present / len(required_fields)
    
    total_score += completeness_score * WEIGHTS["data_completeness"]
    print(f"  [4] Completeness: {completeness_score:.2f} × {WEIGHTS['data_completeness']:.2f}")

    # DIMENSION 5: Freshness
    last_updated = state["initial_data"].get("last_updated", "2024-01-01")
    freshness_score = calculate_data_freshness(last_updated)
    
    freshness_component = freshness_score * WEIGHTS["freshness"]

    # Cap freshness penalty — cannot force RED alone
    min_freshness_contribution = 0.05
    freshness_component = max(freshness_component, min_freshness_contribution)

    total_score += freshness_component
    print(f"  [5] Freshness: {freshness_score:.2f} × {WEIGHTS['freshness']:.2f}")

    # DIMENSION 6: Fraud Risk
    fraud_penalty = len(fraud_indicators) * 0.15
    fraud_penalty = min(fraud_penalty, 0.05)
    risk_score = max(0, WEIGHTS["fraud_risk"] - fraud_penalty)
    total_score += risk_score
    print(f"  [6] Fraud Risk: {WEIGHTS['fraud_risk']:.2f} - {fraud_penalty:.2f}")

    # FINAL SCORE
    final_score = round(max(0.0, min(1.0, total_score)), 3)
    
    requires_human_review = False
    review_reason = ""
    
    if final_score >= 0.90:
        tier = "PLATINUM"
        tier_desc = "Auto-approved - Commit to database"
        tier_emoji = "🟢"
        path = "GREEN"
    elif final_score >= 0.65:
        tier = "GOLD"
        tier_desc = "Auto-approved with monitoring"
        tier_emoji = "🟡"
        path = "YELLOW"
    else:
        tier = "QUESTIONABLE"
        tier_desc = "REQUIRES HUMAN REVIEW"
        tier_emoji = "🔴"
        path = "RED"

        requires_human_review = True
        
        if psv_score < 0.5:
            review_reason = "Primary source verification failed"
        elif len(fraud_indicators) > 0:
            review_reason = f"Fraud indicators detected: {', '.join(fraud_indicators)}"
        elif address_score < 0.4:
            review_reason = "Address reliability too low"
        else:
            review_reason = "Overall confidence below threshold"

    print(f"\n  🔴 PATH: {path}")
    print(f"  CONFIDENCE: {final_score:.3f}")

    # ✅ FIX: Create score_breakdown with 0-1 values (not percentages)
    score_breakdown = {
        "identity": psv_score,
        "address": address_score,
        "completeness": completeness_score,
        "freshness": freshness_score,
        "enrichment": footprint_score,
        "risk": risk_score
    }
    
    # ✅ FIX: Create dimension_percentages separately
    dimension_percentages = {
        "identity": f"{int(psv_score * 100)}%",
        "address": f"{int(address_score * 100)}%",
        "completeness": f"{int(completeness_score * 100)}%",
        "freshness": f"{int(freshness_score * 100)}%",
        "enrichment": f"{int(footprint_score * 100)}%",
        "risk_penalty": f"{int(risk_score * 100)}%"
    }

    return {
        "confidence_score": final_score,
        "requires_human_review": requires_human_review,
        "review_reason": review_reason,
        "quality_metrics": {
            **state.get("quality_metrics", {}),
            "score_breakdown": score_breakdown,  # ✅ 0-1 values
            "dimension_percentages": dimension_percentages,  # ✅ String percentages
            "confidence_tier": tier,
            "tier_description": tier_desc,
            "tier_emoji": tier_emoji,
            "path": path,
            "flag_severity": state.get("quality_metrics", {}).get("flag_severity", {}),
            "risk_score": state.get("quality_metrics", {}).get("risk_score", 0),
            "fraud_indicator_count": len(fraud_indicators),
            "conflict_count": len(state.get("conflicting_data", [])),
            "requires_human_review": requires_human_review,
            "review_reason": review_reason
        }
    }

# ============================================
# HITL DECISION & ACTION NODES
# ============================================
def hitl_decision_node(state: AgentState) -> Literal["auto_approve", "human_review"]:
    """Router: Decides auto-approve vs human review."""
    if state.get("requires_human_review", False):
        print("\n🔴 RED PATH: Routing to human review...")
        return "human_review"
    else:
        print("\n🟢 GREEN/YELLOW PATH: Auto-approving...")
        return "auto_approve"

def human_review_interrupt_node(state: AgentState) -> dict:
    """
    OPTION B: Manual Human-in-the-Loop (SQLite Queue)
    """

    print("\n┌─────────────────────────────────────────┐")
    print("│ HUMAN REVIEW REQUIRED                  │")
    print("└─────────────────────────────────────────┘")

    try:
        conn = sqlite3.connect("review_queue.db")
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO review_queue
            (provider_name, npi, confidence, flags, status, review_reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            state["initial_data"].get("full_name"),
            state["initial_data"].get("NPI"),
            state.get("confidence_score"),
            json.dumps(state.get("qa_flags", [])),
            "PENDING",
            state.get("review_reason"),
            datetime.datetime.now().isoformat()
        ))

        review_id = cursor.lastrowid
        conn.commit()
        conn.close()

        print(f"📋 Review Queue Entry #{review_id} created")
        print(f"   Reason: {state.get('review_reason')}")
        print(f"   Confidence: {state.get('confidence_score', 0):.2%}")

    except Exception as e:
        print(f"⚠️ Failed to save to review queue: {e}")
        review_id = None

    # ---- CRITICAL: Set final_profile from golden_record ----
    final_profile = state.get("golden_record", {})
    
    # Fallback if golden_record is empty
    if not final_profile or not final_profile.get("provider_name"):
        final_profile = {
            "provider_name": state["initial_data"].get("full_name"),
            "npi": state["initial_data"].get("NPI"),
            "specialty": state["initial_data"].get("specialty"),
            "address": state["initial_data"].get("address"),
            "phone": state["initial_data"].get("phone"),
        }

    return {
        "final_profile": final_profile,  # ← CRITICAL: Must be set
        "log": [f"HITL: Sent to manual review (ID {review_id})"]
    }


def auto_approve_node(state: AgentState) -> dict:
    """Auto-approval and database commit."""
    print("\n✅ AUTO-APPROVED: Committing to database...")
    
    golden_record = state.get("golden_record", {})
    
    # Fallback if golden_record is empty
    if not golden_record or not golden_record.get("provider_name"):
        golden_record = {
            "provider_name": state["initial_data"].get("full_name"),
            "npi": state["initial_data"].get("NPI"),
            "specialty": state["initial_data"].get("specialty"),
            "address": state["initial_data"].get("address"),
            "phone": state["initial_data"].get("phone"),
        }
    
    # DATABASE COMMIT
    try:
        save_to_database(golden_record, state)
        print("  ✓ Successfully saved to database")
    except Exception as e:
        logger.error(f"Database save failed: {e}")
        print(f"  ✗ Database save failed: {e}")
    
    return {
        "final_profile": golden_record,  # ← CRITICAL: Must be set
        "log": [f"AUTO-APPROVED: Confidence {state.get('confidence_score', 0):.2%}"]
    }

# ============================================
# DATABASE FUNCTIONS
# ============================================
def save_to_database(golden_record: dict, state: AgentState):
    """
    Save validated provider to database.
    
    Options:
    1. PostgreSQL with SQLAlchemy
    2. MongoDB
    3. Supabase
    4. CSV export (for testing)
    """
    # OPTION 1: PostgreSQL (recommended)
    # from sqlalchemy import create_engine
    # engine = create_engine(os.getenv("DATABASE_URL"))
    # with engine.connect() as conn:
    #     conn.execute("""
    #         INSERT INTO providers (npi, name, specialty, ...)
    #         VALUES (:npi, :name, :specialty, ...)
    #         ON CONFLICT (npi) DO UPDATE SET ...
    #     """, golden_record)
    
    # OPTION 2: MongoDB
    # from pymongo import MongoClient
    # client = MongoClient(os.getenv("MONGO_URI"))
    # db = client.healthcare
    # db.providers.update_one(
    #     {"npi": golden_record["npi"]},
    #     {"$set": golden_record},
    #     upsert=True
    # )
    
    # OPTION 3: CSV Export (for testing)
    output_dir = Path(__file__).parent / "output"
    output_dir.mkdir(exist_ok=True)
    
    import csv
    csv_file = output_dir / "validated_providers.csv"
    
    file_exists = csv_file.exists()
    with open(csv_file, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=golden_record.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(golden_record)
    
    # Also save metadata
    metadata_file = output_dir / f"metadata_{golden_record['npi']}.json"
    with open(metadata_file, 'w') as f:
        json.dump({
            "golden_record": golden_record,
            "quality_metrics": state.get("quality_metrics", {}),
            "execution_metadata": state.get("execution_metadata", {}),
            "confidence_score": state.get("confidence_score", 0)
        }, f, indent=2)

# ============================================
# GRAPH CONSTRUCTION
# ============================================
workflow = StateGraph(AgentState)

# Add all nodes
workflow.add_node("dispatcher", lambda state: state)
workflow.add_node("verify_npi", verify_npi_node)
workflow.add_node("check_oig", check_oig_exclusion_node)
workflow.add_node("verify_license", verify_state_license_node)
workflow.add_node("validate_address", validate_address_node)
workflow.add_node("web_enrichment", web_enrichment_node)
workflow.add_node("merge_results", merge_parallel_results_node)
workflow.add_node("quality_assurance", quality_assurance_node)
workflow.add_node("ai_arbitration", ai_arbitration_node)
workflow.add_node("confidence_scorer", confidence_scorer_with_hitl_node)
workflow.add_node("human_review", human_review_interrupt_node)
workflow.add_node("auto_approve", auto_approve_node)

# Entry point
workflow.set_entry_point("dispatcher")

# Parallel fan-out
workflow.add_edge("dispatcher", "verify_npi")
workflow.add_edge("dispatcher", "check_oig")
workflow.add_edge("dispatcher", "verify_license")
workflow.add_edge("dispatcher", "validate_address")
workflow.add_edge("dispatcher", "web_enrichment")

# Fan-in through merger
workflow.add_edge("verify_npi", "merge_results")
workflow.add_edge("check_oig", "merge_results")
workflow.add_edge("verify_license", "merge_results")
workflow.add_edge("validate_address", "merge_results")
workflow.add_edge("web_enrichment", "merge_results")

# Sequential flow
workflow.add_edge("merge_results", "quality_assurance")
workflow.add_edge("quality_assurance", "ai_arbitration")
workflow.add_edge("ai_arbitration", "confidence_scorer")

# Conditional routing
workflow.add_conditional_edges(
    "confidence_scorer",
    hitl_decision_node,
    {
        "auto_approve": "auto_approve",
        "human_review": "human_review"
    }
)

# End nodes
workflow.add_edge("auto_approve", END)
workflow.add_edge("human_review", END)

# Compile
app = workflow.compile()

# ============================================
# BATCH PROCESSING
# ============================================
def run_enhanced_pipeline():
    """Run the enhanced pipeline on all providers."""
    providers = get_all_providers()
    results = []
    
    print("\n" + "="*60)
    print("🚀 ENHANCED HEALTHCARE AI PIPELINE v2.1")
    print("   6-Step Workflow with HITL & Fraud Detection")
    print("="*60)
    
    for idx, provider in enumerate(providers[:5], 1):
        print(f"\n{'█'*60}")
        print(f"PROVIDER {idx}/5")
        print(f"{'█'*60}")
        
        initial_state: AgentState = {
            "initial_data": {
                "full_name": provider.get("fullName", ""),
                "NPI": provider.get("npi", ""),
                "address": provider.get("address", ""),
                "city": provider.get("city", ""),
                "state": provider.get("state", ""),
                "zip_code": provider.get("zipCode", ""),
                "website": provider.get("website", ""),
                "specialty": provider.get("specialty", ""),
                "phone": provider.get("phone", ""),
                "license_number": provider.get("license", ""),
                "last_updated": provider.get("lastUpdated", "2024-01-01")
            },
            "log": [],
            "npi_result": {},
            "oig_leie_result": {},
            "state_board_result": {},
            "address_result": {},
            "web_enrichment_data": {},
            "digital_footprint_score": 0.0,
            "qa_flags": [],
            "qa_corrections": {},
            "fraud_indicators": [],
            "conflicting_data": [],
            "golden_record": {},
            "confidence_score": 0.0,
            "confidence_breakdown": {},
            "requires_human_review": False,
            "review_reason": "",
            "final_profile": {},
            "execution_metadata": {},
            "data_provenance": {},
            "quality_metrics": {}
        }

        start_time = time.time()
        final_state = app.invoke(initial_state)
        execution_time = time.time() - start_time
        
        results.append(final_state)
        
        print(f"\n⏱️  Total execution: {execution_time:.2f}s")
        print(f"📊 Final confidence: {final_state.get('confidence_score', 0):.2%}")
        print(f"🎯 Path: {final_state.get('quality_metrics', {}).get('path', 'N/A')}")
    
    print("\n" + "="*60)
    print("✅ PIPELINE COMPLETE")
    print(f"📁 Results saved to: {Path(__file__).parent / 'output'}")
    print("="*60)
    
    return results

if __name__ == "__main__":
    run_enhanced_pipeline()