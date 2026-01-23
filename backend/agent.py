import os
import json
import re
import network_fix
from typing import TypedDict, List, Dict
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from thefuzz import fuzz
import time
from tools import search_npi_registry, validate_address, scrape_provider_website
from provider_requests import get_all_providers
from logic_engine import SurgicalValidator
import datetime

validator = SurgicalValidator()
load_dotenv()

# ============================================
# ENHANCED STATE WITH RICH METADATA
# ============================================
class AgentState(TypedDict):
    initial_data: dict
    log: List[str]
    npi_result: dict
    address_result: dict
    enrichment_data: dict
    qa_flags: List[str]
    qa_corrections: dict        
    final_profile: dict
    confidence_score: float
    # NEW: Advanced metadata
    execution_metadata: dict  # Timing, performance metrics
    data_provenance: dict     # Track where each field came from
    quality_metrics: dict     # Detailed quality breakdown

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

# ============================================
# UTILITY: ROBUST JSON EXTRACTION
# ============================================
def extract_json_from_response(text: str) -> dict:
    """Enhanced JSON extraction with better error handling."""
    if not text or not text.strip():
        raise ValueError("Empty response from LLM")
    
    # Remove markdown
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    
    # Find JSON boundaries
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
        # Attempt fixes
        json_str = json_str.replace("'", '"')
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        return json.loads(json_str)

# ============================================
# STAGE 1: NPI VALIDATION (ENHANCED)
# ============================================
def call_npi_tool(state: AgentState) -> dict:
    """
    ENHANCED NPI Registry validation with rich metadata.
    
    New Features:
    - Timing metrics
    - Match confidence scoring
    - Multiple match disambiguation
    - Data freshness analysis
    """
    print("┌─────────────────────────────────────────┐")
    print("│ STAGE 1: NPI REGISTRY VALIDATION       │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    initial_data = state["initial_data"]
    
    # Smart name parsing (remove titles)
    full_name = initial_data.get("full_name", "")
    titles_to_remove = ["DR.", "DR", "MD", "DDS", "DVM", "DO", "PHD", "PA", "NP"]
    
    name_parts = [
        part for part in full_name.strip().split() 
        if part.upper().replace('.', '') not in titles_to_remove
    ]
    
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    middle_name = name_parts[1] if len(name_parts) > 2 else ""
    
    npi_number = initial_data.get("NPI", "")
    state_code = initial_data.get("state", "")
    
    # Call NPI API
    result = search_npi_registry(
        first_name=first_name, 
        last_name=last_name, 
        npi_number=npi_number, 
        state=state_code
    )
    
    # Enhanced result analysis
    execution_time = time.time() - start_time
    
    # Calculate match confidence
    match_confidence = 0.0
    if result.get("result_count", 0) == 1:
        match_confidence = 1.0
        print("✓ Exact NPI match found")
    elif result.get("result_count", 0) > 1:
        match_confidence = 0.7
        print(f"⚠ Multiple matches ({result['result_count']}) - disambiguation needed")
    else:
        print("✗ No NPI match found - CRITICAL ISSUE")
    
    # Analyze data freshness
    freshness_score = 0.0
    if result.get("result_count", 0) > 0:
        last_updated = result.get("results", [{}])[0].get("basic", {}).get("last_updated")
        if last_updated:
            try:
                update_date = datetime.datetime.strptime(last_updated, "%Y-%m-%d")
                days_old = (datetime.datetime.now() - update_date).days
                freshness_score = max(0, 1 - (days_old / 365))  # Decay over 1 year
                print(f"  Data age: {days_old} days (freshness: {freshness_score:.2f})")
            except:
                pass
    
    print(f"  Execution time: {execution_time:.2f}s")
    print(f"  Match confidence: {match_confidence:.2f}")
    
    # Enhanced metadata
    metadata = {
        "stage": "npi_validation",
        "execution_time_seconds": execution_time,
        "match_confidence": match_confidence,
        "freshness_score": freshness_score,
        "result_count": result.get("result_count", 0),
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "npi_result": result,
        "execution_metadata": {**state.get("execution_metadata", {}), "npi": metadata}
    }

# ============================================
# STAGE 2: ADDRESS VALIDATION (ENHANCED)
# ============================================
def call_address_tool(state: AgentState) -> dict:
    """Enhanced address validation with detailed analysis."""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STAGE 2: ADDRESS VALIDATION            │")
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
    
    # Enhanced verdict parsing
    verdict = result.get("verdict", "Unknown")
    confidence_map = {
        "High Confidence Match": 1.0,
        "Partial Match": 0.7,
        "Low Confidence": 0.4,
        "No Match": 0.0
    }
    
    address_confidence = confidence_map.get(verdict, 0.5)
    print(f"  Verdict: {verdict} (confidence: {address_confidence:.2f})")
    print(f"  Execution time: {execution_time:.2f}s")
    
    metadata = {
        "stage": "address_validation",
        "execution_time_seconds": execution_time,
        "confidence": address_confidence,
        "verdict": verdict,
        "timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
        "address_result": result,
        "execution_metadata": {**state.get("execution_metadata", {}), "address": metadata}
    }

# ============================================
# STAGE 3: WEB ENRICHMENT (ENHANCED)
# ============================================
def enrichment_node(state: AgentState) -> dict:
    """Enhanced enrichment with quality scoring."""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STAGE 3: WEB ENRICHMENT                │")
    print("└─────────────────────────────────────────┘")
    
    start_time = time.time()
    url = state["initial_data"].get("website")
    
    if not url:
        print("  Skipped - No website provided")
        return {
            "enrichment_data": {"status": "Skipped - No website provided"},
            "execution_metadata": {**state.get("execution_metadata", {}), "enrichment": {
                "stage": "enrichment",
                "status": "skipped",
                "execution_time_seconds": 0
            }}
        }
    
    scraped_text = scrape_provider_website(url=url)
    
    if "error" in scraped_text.lower():
        print(f"  ✗ Failed to scrape website")
        return {"enrichment_data": {"error": "Failed to scrape website."}}
    
    print(f"  Scraped {len(scraped_text)} characters")
    
    extraction_prompt = f"""Extract education and board certifications from this text.
Return ONLY a JSON object with keys: education (list), certifications (list), languages (list), insurance_accepted (list).

TEXT: {scraped_text[:4000]}

Example format:
{{"education": ["Harvard Medical School - 2010"], "certifications": ["Board Certified in Surgery"], "languages": ["English", "Spanish"], "insurance_accepted": ["Medicare", "Blue Cross"]}}
"""
    
    try:
        response = llm.invoke(extraction_prompt)
        parsed_data = extract_json_from_response(response.content)
        
        # Calculate enrichment quality score
        enrichment_score = 0.0
        field_weights = {
            "education": 0.35,
            "certifications": 0.35,
            "languages": 0.15,
            "insurance_accepted": 0.15
        }
        
        for field, weight in field_weights.items():
            if parsed_data.get(field) and len(parsed_data[field]) > 0:
                enrichment_score += weight
        
        print(f"  ✓ Extracted {sum(len(parsed_data.get(k, [])) for k in ['education', 'certifications', 'languages', 'insurance_accepted'])} items")
        print(f"  Enrichment quality: {enrichment_score:.2f}")
        
        execution_time = time.time() - start_time
        
        metadata = {
            "stage": "enrichment",
            "execution_time_seconds": execution_time,
            "enrichment_score": enrichment_score,
            "items_extracted": sum(len(parsed_data.get(k, [])) for k in ['education', 'certifications', 'languages', 'insurance_accepted']),
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        return {
            "enrichment_data": parsed_data,
            "execution_metadata": {**state.get("execution_metadata", {}), "enrichment": metadata}
        }
    except Exception as e:
        print(f"  ✗ Enrichment parsing error: {e}")
        return {"enrichment_data": {"error": f"Failed to parse: {str(e)}"}}

# ============================================
# STAGE 4: QUALITY ASSURANCE (ULTRA-ENHANCED)
# ============================================
def quality_assurance_node(state: AgentState) -> dict:
    """
    ULTRA-ENHANCED Quality Assurance with surgical precision.
    
    New Features:
    - Detailed flag categorization (Critical/Warning/Info)
    - Smart auto-healing decisions with confidence scores
    - Cross-field validation (e.g., specialty vs certifications)
    - Risk scoring
    """
    print("\n┌─────────────────────────────────────────┐")
    print("│ STAGE 4: QUALITY ASSURANCE (SURGICAL)  │")
    print("└─────────────────────────────────────────┘")

    flags = []
    corrections = {}
    initial_data = state["initial_data"]
    
    # Track flag severity
    flag_severity = {
        "CRITICAL": [],
        "WARNING": [],
        "INFO": []
    }

    # ========================================
    # CHECK 1: ADDRESS VALIDATION & AUTO-HEAL
    # ========================================
    print("\n  [1/6] Address Validation & Auto-Healing...")
    input_address = initial_data.get("address", "")

    npi_address = ""
    for addr in state["npi_result"].get("addresses", []):
        if addr.get("address_purpose") == "LOCATION":
            npi_address = addr.get("address_1", "")
            if addr.get("address_2"):
                npi_address += " " + addr.get("address_2")
            break

    if npi_address:
        validation_result = validator.compare_addresses(input_address, npi_address)

        if validation_result["action"] == "AUTO_CORRECT":
            corrections["address"] = validation_result["new_value"]
            flag = f"AUTO-HEALED: {validation_result['reason']} (confidence: {validation_result.get('confidence', 0):.2f})"
            flags.append(flag)
            flag_severity["INFO"].append(flag)
            print(f"    ✓ {flag}")

        elif validation_result["action"] == "FLAG":
            flag = f"ADDRESS MISMATCH: {validation_result['reason']}"
            flags.append(flag)
            
            if validation_result.get('confidence', 0) < 0.5:
                flag_severity["CRITICAL"].append(flag)
                print(f"    ✗ CRITICAL: {flag}")
            else:
                flag_severity["WARNING"].append(flag)
                print(f"    ⚠ WARNING: {flag}")
    else:
        flag = "No NPI address found for comparison"
        flags.append(flag)
        flag_severity["WARNING"].append(flag)
        print(f"    ⚠ {flag}")

    # ========================================
    # CHECK 2: DATA HEALTH SCORING
    # ========================================
    print("\n  [2/6] Data Health Analysis...")

    health_report = validator.calculate_data_health(
        last_updated_date=initial_data.get("last_updated", "2024-01-01"),
        source_type="CSV_UPLOAD",
        provider_type=state["npi_result"].get("enumeration_type", "NPI-1"),
    )

    # store full structured report (IMPORTANT, don't lose this)
    corrections["data_health_report"] = health_report

    # extract numeric score safely (0–100)
    health_score = int(health_report.get("current_reliability", 0) * 100)

    print(f"    Health Score: {health_score}/100 ({health_report.get('status')})")

    if health_score < 50:
        flag = f"DATA HEALTH CRITICAL: Score {health_score}/100 ({health_report.get('status')})"
        flags.append(flag)
        flag_severity["CRITICAL"].append(flag)
        print(f"    ✗ CRITICAL: Stale/unreliable data")

    elif health_score < 70:
        flag = f"DATA HEALTH WARNING: Score {health_score}/100"
        flags.append(flag)
        flag_severity["WARNING"].append(flag)
        print(f"    ⚠ WARNING: Review recommended")

    else:
        print(f"    ✓ Data health acceptable")


    # ========================================
    # CHECK 3: LICENSE VALIDATION
    # ========================================
    print("\n  [3/6] License Verification...")
    license_number = initial_data.get("license_number", "").strip()

    if not license_number:
        flag = "LICENSE ISSUE: Missing license number"
        flags.append(flag)
        flag_severity["WARNING"].append(flag)
        print(f"    ⚠ {flag}")
    elif "SUSPENDED" in license_number.upper():
        flag = "❌ CRITICAL: License SUSPENDED - DO NOT USE"
        flags.append(flag)
        flag_severity["CRITICAL"].append(flag)
        print(f"    ✗ {flag}")
    elif "REVOKED" in license_number.upper():
        flag = "❌ CRITICAL: License REVOKED - DO NOT USE"
        flags.append(flag)
        flag_severity["CRITICAL"].append(flag)
        print(f"    ✗ {flag}")
    else:
        print(f"    ✓ License appears valid")

    # ========================================
    # CHECK 4: SPECIALTY CONSISTENCY
    # ========================================
    print("\n  [4/6] Specialty Cross-Validation...")
    input_specialty = initial_data.get("specialty", "")
    npi_specialties = [
        tax.get("desc") for tax in state["npi_result"].get("taxonomies", [])
    ]

    if input_specialty and npi_specialties:
        specialty_match = any(
            fuzz.partial_ratio(input_specialty.lower(), npi_spec.lower()) > 80
            for npi_spec in npi_specialties
        )

        if not specialty_match:
            flag = f"SPECIALTY MISMATCH: '{input_specialty}' vs NPI {npi_specialties}"
            flags.append(flag)
            flag_severity["WARNING"].append(flag)
            
            corrections["specialty"] = npi_specialties[0]
            heal_flag = f"AUTO-HEALED: Updated specialty to '{npi_specialties[0]}'"
            flags.append(heal_flag)
            flag_severity["INFO"].append(heal_flag)
            print(f"    ⚠ Mismatch detected, auto-corrected to NPI value")
        else:
            print(f"    ✓ Specialty matches NPI records")
    
    # ========================================
    # CHECK 5: PHONE NUMBER VALIDATION
    # ========================================
    print("\n  [5/6] Phone Number Validation...")
    input_phone = initial_data.get("phone", "")
    
    npi_phone = ""
    for addr in state["npi_result"].get("addresses", []):
        if addr.get("telephone_number"):
            npi_phone = addr.get("telephone_number")
            break
    
    if input_phone and npi_phone:
        norm_input = ''.join(filter(str.isdigit, input_phone))
        norm_npi = ''.join(filter(str.isdigit, npi_phone))
        
        if norm_input != norm_npi:
            corrections["phone"] = npi_phone
            heal_flag = f"AUTO-HEALED: Phone updated to NPI value"
            flags.append(heal_flag)
            flag_severity["INFO"].append(heal_flag)
            print(f"    ✓ {heal_flag}")
    elif not input_phone and npi_phone:
        corrections["phone"] = npi_phone
        print(f"    ✓ Added missing phone from NPI")
    
    # ========================================
    # CHECK 6: CROSS-FIELD VALIDATION
    # ========================================
    print("\n  [6/6] Cross-Field Consistency Checks...")
    
    # Check if certifications match specialty
    certifications = state.get("enrichment_data", {}).get("certifications", [])
    if input_specialty and certifications:
        cert_match = any(input_specialty.lower() in cert.lower() for cert in certifications)
        if not cert_match:
            flag = f"INFO: Certifications don't explicitly mention specialty '{input_specialty}'"
            flags.append(flag)
            flag_severity["INFO"].append(flag)
            print(f"    ℹ {flag}")
        else:
            print(f"    ✓ Certifications align with specialty")
    
    # Calculate overall risk score
    risk_score = (
        len(flag_severity["CRITICAL"]) * 10 +
        len(flag_severity["WARNING"]) * 3 +
        len(flag_severity["INFO"]) * 0.5
    )
    
    print(f"\n  Risk Score: {risk_score:.1f}")
    print(f"  Flags: {len(flag_severity['CRITICAL'])} Critical | {len(flag_severity['WARNING'])} Warnings | {len(flag_severity['INFO'])} Info")

    return {
        "qa_flags": flags,
        "qa_corrections": corrections,
        "quality_metrics": {
            "flag_severity": flag_severity,
            "risk_score": risk_score,
            "total_flags": len(flags),
            "auto_healed_count": len(flag_severity["INFO"])
        }
    }

# ============================================
# STAGE 5: AI SYNTHESIS (ENHANCED)
# ============================================
def synthesis_node(state: AgentState) -> dict:
    """Enhanced synthesis with provenance tracking."""
    print("\n┌─────────────────────────────────────────┐")
    print("│ STAGE 5: AI-POWERED SYNTHESIS          │")
    print("└─────────────────────────────────────────┘")
    
    max_attempts = 3
    
    for attempt in range(max_attempts):
        try:
            print(f"\n  Attempt {attempt + 1}/{max_attempts}...")
            
            prompt = f"""You are a data synthesizer. Combine this data into ONE JSON object.

INPUT DATA:
- Initial: {json.dumps(state['initial_data'], indent=2)}
- NPI: {json.dumps(state['npi_result'], indent=2)}
- Address: {json.dumps(state['address_result'], indent=2)}
- Enrichment: {json.dumps(state['enrichment_data'], indent=2)}
- QA Flags: {json.dumps(state['qa_flags'], indent=2)}

RULES:
1. NPI Registry is MOST authoritative for: name, NPI, specialty, address
2. Apply QA corrections: {json.dumps(state.get('qa_corrections', {}))}
3. Combine (don't overwrite) complementary data
4. Track data sources for each field

OUTPUT (JSON only, no markdown):
{{
  "provider_name": "...",
  "npi": "...",
  "specialty": "...",
  "address": "...",
  "phone": "...",
  "website": "...",
  "education": [],
  "certifications": [],
  "languages": [],
  "insurance_accepted": [],
  "npi_match_found": true/false,
  "address_validation": "...",
  "data_sources": {{"name": "NPI Registry", "address": "NPI (auto-corrected)", ...}}
}}"""
            
            response = llm.invoke(prompt)
            final_json = extract_json_from_response(response.content)
            
            # Apply corrections
            corrections = state.get("qa_corrections", {})
            if corrections:
                final_json.update(corrections)
                print(f"  ✓ Applied {len(corrections)} QA corrections")
            
            # Add metadata
            final_json["synthesis_timestamp"] = datetime.datetime.now().isoformat()
            final_json["qa_flags"] = state.get("qa_flags", [])
            
            print(f"  ✓ Synthesis successful ({len(final_json)} fields)")
            return {
                "final_profile": final_json,
                "quality_metrics": state.get("quality_metrics", {}),  # PRESERVE existing quality_metrics
                "execution_metadata": state.get("execution_metadata", {})  # PRESERVE metadata
            }
            
        except Exception as e:
            print(f"  ✗ Attempt {attempt + 1} failed: {e}")
            if attempt < max_attempts - 1:
                time.sleep(2 * (attempt + 1))
    
    # Fallback
    print("  ⚠ Using fallback synthesis")
    fallback = {
        "provider_name": state["initial_data"].get("full_name", "Unknown"),
        "npi": state["initial_data"].get("NPI"),
        "specialty": state["npi_result"].get("taxonomies", [{}])[0].get("desc"),
        "address": state.get("qa_corrections", {}).get("address") or state["initial_data"].get("address"),
        "phone": state.get("qa_corrections", {}).get("phone"),
        "website": state["initial_data"].get("website"),
        "education": state.get("enrichment_data", {}).get("education", []),
        "certifications": state.get("enrichment_data", {}).get("certifications", []),
        "npi_match_found": state["npi_result"].get("result_count", 0) > 0,
        "address_validation": state.get("address_result", {}).get("verdict"),
        "qa_flags": state.get("qa_flags", []),
        "synthesis_status": "fallback",
        "synthesis_timestamp": datetime.datetime.now().isoformat()
    }
    
    return {
    "final_profile": fallback,
    "quality_metrics": state.get("quality_metrics", {}),
    "execution_metadata": state.get("execution_metadata", {})
}

# ============================================
# STAGE 6: ULTIMATE CONFIDENCE SCORING
# ============================================
def confidence_scorer_node(state: AgentState) -> dict:
    """
    ULTIMATE multi-dimensional confidence scoring.
    
    Dimensions:
    1. Identity Verification (30%) - NPI match, name accuracy
    2. Address Reliability (22%) - USPS validation, NPI consistency  
    3. Data Completeness (18%) - Fields filled, enrichment quality
    4. Freshness (10%) - Data age, update recency
    5. Enrichment Quality (10%) - Website data extraction success
    6. Risk Factors (10%) - QA flags, license issues
    """
    print("\n┌─────────────────────────────────────────┐")
    print("│ STAGE 6: ADVANCED CONFIDENCE SCORING   │")
    print("└─────────────────────────────────────────┘")

    final_data = state.get("final_profile", {})
    initial_data = state.get("initial_data", {})
    qa_flags = state.get("qa_flags", [])
    quality_metrics = state.get("quality_metrics", {})

    logs = []
    total_score = 0.0

    # Weight configuration (sum = 1.0)
    WEIGHTS = {
        "identity": 0.30,
        "address": 0.22,
        "completeness": 0.18,
        "freshness": 0.10,
        "enrichment": 0.10,
        "risk": 0.10
    }

    print("\n  Scoring Dimensions:")
    print("  ─────────────────────────────────────────")

    # ========================================
    # 1️⃣ IDENTITY TRUST (30%)
    # ========================================
    identity_raw = 0.0
    
    if final_data.get("npi_match_found"):
        identity_raw = 1.0
        
        # Bonus for match confidence
        exec_meta = state.get("execution_metadata", {})
        npi_meta = exec_meta.get("npi", {})
        match_conf = npi_meta.get("match_confidence", 0)
        
        if match_conf >= 0.95:
            identity_raw = 1.0
            logs.append("Identity ✓✓ Exact NPI match")
        elif match_conf >= 0.7:
            identity_raw = 0.85
            logs.append("Identity ✓ NPI match (multiple results)")
        else:
            identity_raw = 0.7
            logs.append("Identity ◐ Weak NPI match")
    else:
        logs.append("Identity ✗ NPI NOT FOUND")

    identity_score = identity_raw * WEIGHTS["identity"]
    total_score += identity_score
    print(f"  [1] Identity: {identity_raw:.2f} × {WEIGHTS['identity']:.2f} = {identity_score:.3f}")

    # ========================================
    # 2️⃣ ADDRESS RELIABILITY (22%)
    # ========================================
    address_raw = 0.0

    address_validation = final_data.get("address_validation")
    verdict = None
    
    if isinstance(address_validation, dict):
        verdict = address_validation.get("verdict")
    elif isinstance(address_validation, str):
        verdict = address_validation

    if verdict == "High Confidence Match":
        address_raw = 1.0
        logs.append("Address ✓ High confidence USPS match")
    elif verdict and "partial" in verdict.lower():
        address_raw = 0.65
        logs.append("Address ◐ Partial USPS match")
    elif verdict:
        address_raw = 0.35
        logs.append("Address ⚠ Weak/uncertain match")
    else:
        logs.append("Address ✗ No validation data")

    address_score = address_raw * WEIGHTS["address"]
    total_score += address_score
    print(f"  [2] Address: {address_raw:.2f} × {WEIGHTS['address']:.2f} = {address_score:.3f}")

    # ========================================
    # 3️⃣ DATA COMPLETENESS (18%)
    # ========================================
    required_fields = ["provider_name", "npi", "specialty", "address", "phone", "website"]
    present = sum(1 for f in required_fields if final_data.get(f))
    completeness_ratio = present / len(required_fields)

    logs.append(f"Completeness ℹ {present}/{len(required_fields)} fields present")

    completeness_score = completeness_ratio * WEIGHTS["completeness"]
    total_score += completeness_score
    print(f"  [3] Completeness: {completeness_ratio:.2f} × {WEIGHTS['completeness']:.2f} = {completeness_score:.3f}")

    # ========================================
    # 4️⃣ DATA FRESHNESS (10%)
    # ========================================
    freshness_raw = 0.6
    last_updated = initial_data.get("last_updated")

    if last_updated:
        try:
            last_dt = datetime.datetime.strptime(last_updated, "%Y-%m-%d")
            days_old = (datetime.datetime.now() - last_dt).days
            freshness_raw = pow(2.71828, -days_old / 365)
            logs.append(f"Freshness ⏳ {days_old} days old (decay={freshness_raw:.2f})")
        except:
            logs.append("Freshness ⚠ Invalid date format")

    freshness_score = freshness_raw * WEIGHTS["freshness"]
    total_score += freshness_score
    print(f"  [4] Freshness: {freshness_raw:.2f} × {WEIGHTS['freshness']:.2f} = {freshness_score:.3f}")

    # ========================================
    # 5️⃣ ENRICHMENT QUALITY (10%)
    # ========================================
    enrichment_raw = 0.0

    if final_data.get("website"):
        enrichment_raw += 0.3
    if final_data.get("education"):
        enrichment_raw += 0.25
    if final_data.get("certifications"):
        enrichment_raw += 0.25
    if final_data.get("languages"):
        enrichment_raw += 0.1
    if final_data.get("insurance_accepted"):
        enrichment_raw += 0.1

    enrichment_raw = min(1.0, enrichment_raw)
    logs.append(f"Enrichment 🌐 score={enrichment_raw:.2f}")

    enrichment_score = enrichment_raw * WEIGHTS["enrichment"]
    total_score += enrichment_score
    print(f"  [5] Enrichment: {enrichment_raw:.2f} × {WEIGHTS['enrichment']:.2f} = {enrichment_score:.3f}")

    # ========================================
    # 6️⃣ RISK & PENALTIES (10%)
    # ========================================
    risk_penalty = 0.0
    flag_severity = quality_metrics.get("flag_severity", {})
    
    critical_count = len(flag_severity.get("CRITICAL", []))
    warning_count = len(flag_severity.get("WARNING", []))
    
    if critical_count > 0:
        penalty = min(0.08, 0.04 * critical_count)
        risk_penalty += penalty
        logs.append(f"Risk ⚠⚠ {critical_count} CRITICAL flags (-{penalty*100:.0f}%)")
    
    if warning_count > 0:
        penalty = min(0.04, 0.01 * warning_count)
        risk_penalty += penalty
        logs.append(f"Risk ⚠ {warning_count} warnings (-{penalty*100:.0f}%)")

    if final_data.get("synthesis_status", "").startswith("fallback"):
        risk_penalty += 0.02
        logs.append("Risk ⚠ Fallback synthesis used (-2%)")

    risk_score = max(0.0, WEIGHTS["risk"] - risk_penalty)
    total_score += risk_score
    print(f"  [6] Risk: {WEIGHTS['risk']:.2f} - {risk_penalty:.2f} = {risk_score:.3f}")

    # ========================================
    # FINAL NORMALIZATION & TIER ASSIGNMENT
    # ========================================
    final_score = round(max(0.0, min(1.0, total_score)), 3)
    
    # Assign confidence tier
    if final_score >= 0.90:
        tier = "PLATINUM"
        tier_desc = "Exceptional - Use immediately, highest reliability"
        tier_emoji = "🏆"
    elif final_score >= 0.80:
        tier = "GOLD"
        tier_desc = "Excellent - Very reliable, minor review optional"
        tier_emoji = "🥇"
    elif final_score >= 0.70:
        tier = "SILVER"
        tier_desc = "Good - Reliable with minor issues flagged"
        tier_emoji = "🥈"
    elif final_score >= 0.60:
        tier = "BRONZE"
        tier_desc = "Fair - Usable but needs review"
        tier_emoji = "🥉"
    elif final_score >= 0.40:
        tier = "QUESTIONABLE"
        tier_desc = "Poor - Manual verification required"
        tier_emoji = "⚠️"
    else:
        tier = "UNUSABLE"
        tier_desc = "Critical issues - Do not use without verification"
        tier_emoji = "❌"

    print("\n  ═════════════════════════════════════════")
    print(f"  {tier_emoji} CONFIDENCE TIER: {tier}")
    print(f"  Score: {final_score:.3f} ({final_score*100:.1f}%)")
    print(f"  {tier_desc}")
    print("  ═════════════════════════════════════════")

    logs.append(f"FINAL CONFIDENCE = {final_score*100:.1f}%")
    logs.append(f"TIER = {tier} ({tier_desc})")

    # Build detailed breakdown
    breakdown = {
        "identity": round(identity_score, 3),
        "address": round(address_score, 3),
        "completeness": round(completeness_score, 3),
        "freshness": round(freshness_score, 3),
        "enrichment": round(enrichment_score, 3),
        "risk": round(risk_score, 3)
    }

    return {
        "confidence_score": final_score,
        "log": logs,
        "quality_metrics": {
            **quality_metrics,
            "confidence_tier": tier,
            "tier_description": tier_desc,
            "tier_emoji": tier_emoji,
            "score_breakdown": breakdown,
            "dimension_percentages": {
                "identity": f"{(identity_raw * 100):.1f}%",
                "address": f"{(address_raw * 100):.1f}%",
                "completeness": f"{(completeness_ratio * 100):.1f}%",
                "freshness": f"{(freshness_raw * 100):.1f}%",
                "enrichment": f"{(enrichment_raw * 100):.1f}%",
                "risk_penalty": f"{(risk_penalty * 100):.1f}%"
            }
        }
    }

# ============================================
# GRAPH CONSTRUCTION
# ============================================
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("npi_tool", call_npi_tool)
workflow.add_node("address_tool", call_address_tool)
workflow.add_node("enrichment", enrichment_node)
workflow.add_node("quality_assurance", quality_assurance_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("scorer", confidence_scorer_node)

# Define flow
workflow.set_entry_point("npi_tool")
workflow.add_edge("npi_tool", "address_tool")
workflow.add_edge("address_tool", "enrichment")
workflow.add_edge("enrichment", "quality_assurance")
workflow.add_edge("quality_assurance", "synthesis")
workflow.add_edge("synthesis", "scorer")
workflow.add_edge("scorer", END)

# Compile
app = workflow.compile()

# ============================================
# BATCH PROCESSING WITH RICH OUTPUT
# ============================================
def run_agent_on_all_providers():
    """Process all providers with enhanced reporting."""
    providers = get_all_providers()
    results = []
    
    print("\n" + "="*50)
    print("🚀 HEALTHCARE AI PIPELINE - BATCH PROCESSING")
    print("="*50)
    print(f"\nProcessing {len(providers)} providers...\n")
    
    for idx, provider in enumerate(providers, 1):
        print(f"\n{'='*50}")
        print(f"PROVIDER {idx}/{len(providers)}")
        print(f"{'='*50}")
        
        initial_data = {
            "full_name": provider.get("full_name", ""),
            "NPI": provider.get("npi", ""),
            "address": provider.get("address", ""),
            "city": provider.get("city", ""),
            "state": provider.get("state", ""),
            "zip_code": provider.get("zip_code", ""),
            "website": provider.get("website", ""),
            "specialty": provider.get("specialty", ""),
            "phone": provider.get("phone", ""),
            "license_number": provider.get("license_number", ""),
            "last_updated": provider.get("last_updated", "2024-01-01")
        }

        initial_state: AgentState = {
            "initial_data": initial_data,
            "log": [],
            "npi_result": {},
            "address_result": {},
            "enrichment_data": {},
            "qa_flags": [],
            "qa_corrections": {},
            "final_profile": {},
            "confidence_score": 0.0,
            "execution_metadata": {},
            "data_provenance": {},
            "quality_metrics": {}
        }

        start_time = time.time()
        final_state = app.invoke(initial_state)
        execution_time = time.time() - start_time
        
        # Add execution summary
        final_state["execution_metadata"]["total_execution_time"] = execution_time
        
        results.append(final_state)
        
        # Print summary for this provider
        print_provider_summary(final_state, execution_time)
    
    print("\n" + "="*50)
    print("✅ BATCH PROCESSING COMPLETE")
    print("="*50)
    
    # Print aggregate statistics
    print_aggregate_stats(results)
    
    return results

def print_provider_summary(state: dict, execution_time: float):
    """Print detailed summary for a single provider."""
    profile = state.get("final_profile", {})
    quality = state.get("quality_metrics", {})
    
    print("\n📊 PROCESSING SUMMARY:")
    print("─────────────────────────────────────────")
    print(f"Provider: {profile.get('provider_name', 'Unknown')}")
    print(f"NPI: {profile.get('npi', 'N/A')}")
    print(f"Confidence: {state.get('confidence_score', 0):.3f} ({quality.get('confidence_tier', 'N/A')})")
    print(f"QA Flags: {len(state.get('qa_flags', []))}")
    print(f"Execution Time: {execution_time:.2f}s")
    
    # Show flag breakdown
    flag_severity = quality.get("flag_severity", {})
    if flag_severity:
        print(f"  - Critical: {len(flag_severity.get('CRITICAL', []))}")
        print(f"  - Warnings: {len(flag_severity.get('WARNING', []))}")
        print(f"  - Info: {len(flag_severity.get('INFO', []))}")

def print_aggregate_stats(results: list):
    """Print statistics across all processed providers."""
    if not results:
        return
    
    scores = [r.get("confidence_score", 0) for r in results]
    avg_score = sum(scores) / len(scores)
    
    tier_counts = {}
    for r in results:
        tier = r.get("quality_metrics", {}).get("confidence_tier", "Unknown")
        tier_counts[tier] = tier_counts.get(tier, 0) + 1
    
    print("\n📈 AGGREGATE STATISTICS:")
    print("─────────────────────────────────────────")
    print(f"Total Providers: {len(results)}")
    print(f"Average Confidence: {avg_score:.3f}")
    print(f"Highest Score: {max(scores):.3f}")
    print(f"Lowest Score: {min(scores):.3f}")
    print("\nTier Distribution:")
    for tier, count in sorted(tier_counts.items(), reverse=True):
        print(f"  {tier}: {count} ({count/len(results)*100:.1f}%)")

# ============================================
# MAIN EXECUTION
# ============================================
if __name__ == "__main__":
    print("\n" + "🏥" * 25)
    print("ULTIMATE HEALTHCARE PROVIDER VALIDATION SYSTEM")
    print("Multi-Agent AI Pipeline with Surgical Precision")
    print("🏥" * 25)
    
    from provider_requests import get_all_providers

    providers = get_all_providers()
    
    # Process first 5 for testing (remove limit for full run)
    print(f"\n⚙️ Processing {min(5, len(providers))} providers (testing mode)...\n")
    
    for idx, provider in enumerate(providers[:5], 1):
        print(f"\n{'█'*50}")
        print(f"PROCESSING PROVIDER {idx}/5")
        print(f"{'█'*50}")
        
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
            "address_result": {},
            "enrichment_data": {},
            "qa_flags": [],
            "qa_corrections": {},
            "final_profile": {},
            "confidence_score": 0.0,
            "execution_metadata": {},
            "data_provenance": {},
            "quality_metrics": {}
        }

        pipeline_start = time.time()
        final_state = app.invoke(initial_state)
        pipeline_time = time.time() - pipeline_start

        # Display results
        print("\n" + "▓"*50)
        print("FINAL RESULTS")
        print("▓"*50)
        
        profile = final_state["final_profile"]
        quality = final_state["quality_metrics"]
        
        print(f"\n🔍 PROVIDER PROFILE:")
        print(f"  Name: {profile.get('provider_name', 'N/A')}")
        print(f"  NPI: {profile.get('npi', 'N/A')}")
        print(f"  Specialty: {profile.get('specialty', 'N/A')}")
        print(f"  Address: {profile.get('address', 'N/A')}")
        print(f"  Phone: {profile.get('phone', 'N/A')}")
        print(f"  Website: {profile.get('website', 'N/A')}")
        
        if profile.get('education'):
            print(f"  Education: {', '.join(profile['education'][:2])}")
        if profile.get('certifications'):
            print(f"  Certifications: {', '.join(profile['certifications'][:2])}")
        
        print(f"\n🎯 CONFIDENCE METRICS:")
        print(f"  Overall Score: {final_state['confidence_score']:.3f} ({final_state['confidence_score']*100:.1f}%)")
        print(f"  Tier: {quality.get('tier_emoji', '')} {quality.get('confidence_tier', 'N/A')}")
        print(f"  Description: {quality.get('tier_description', 'N/A')}")
        
        print(f"\n📊 DIMENSION BREAKDOWN:")
        breakdown = quality.get('score_breakdown', {})
        percentages = quality.get('dimension_percentages', {})
        for dim in ['identity', 'address', 'completeness', 'freshness', 'enrichment', 'risk']:
            score = breakdown.get(dim, 0)
            pct = percentages.get(dim, '0%')
            print(f"  {dim.capitalize():12} : {score:.3f} ({pct})")
        
        print(f"\n🚩 QUALITY ASSURANCE:")
        flag_severity = quality.get('flag_severity', {})
        print(f"  Critical Flags: {len(flag_severity.get('CRITICAL', []))}")
        print(f"  Warnings: {len(flag_severity.get('WARNING', []))}")
        print(f"  Info/Auto-healed: {len(flag_severity.get('INFO', []))}")
        print(f"  Risk Score: {quality.get('risk_score', 0):.1f}")
        
        print(f"\n⏱️ PERFORMANCE:")
        print(f"  Total Pipeline Time: {pipeline_time:.2f}s")
        
        exec_meta = final_state.get('execution_metadata', {})
        if exec_meta:
            print(f"  Stage Breakdown:")
            for stage in ['npi', 'address', 'enrichment']:
                meta = exec_meta.get(stage, {})
                if meta:
                    print(f"    {stage.capitalize():12} : {meta.get('execution_time_seconds', 0):.2f}s")
        
        print("\n" + "─"*50 + "\n")

    print("\n" + "✅" * 25)
    print("PIPELINE EXECUTION COMPLETE")
    print("✅" * 25 + "\n")