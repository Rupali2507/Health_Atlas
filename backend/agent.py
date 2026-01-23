import os
import json
import re
import network_fix
from typing import TypedDict, List
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


llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)

def extract_json_from_response(text: str) -> dict:
    """
    Robustly extract JSON from LLM response that may contain markdown or extra text.
    """
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
        raise ValueError(f"No valid JSON found in response. Text: {text[:200]}")
    
    json_str = text[first_brace:last_brace + 1]
    
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        json_str = json_str.replace("'", '"')
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        return json.loads(json_str)

# --- PIPELINE NODES ---

def call_npi_tool(state: AgentState) -> dict:
    """Calls the NPI Registry tool to validate the provider."""
    print("---AGENT ROLE: Data Validation (NPI Check)---")
    initial_data = state["initial_data"]
    
    # Smart name parsing to remove titles like "Dr."
    full_name = initial_data.get("full_name", "")
    titles_to_remove = ["DR.", "DR", "MD", "DDS", "DVM"]
    name_parts = [
        part for part in full_name.strip().split() 
        if part.upper().replace('.', '') not in titles_to_remove
    ]
    
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    npi_number = initial_data.get("NPI", "")
    st = initial_data.get("state", "")

    result = search_npi_registry(first_name=first_name, last_name=last_name, npi_number=npi_number, state=st)
    
    return {"npi_result": result}

def call_address_tool(state: AgentState) -> dict:
    print("---AGENT ROLE: Data Validation (Address Check)---")
    initial_data = state["initial_data"]
    result = validate_address(
        address=initial_data.get("address", ""), 
        city=initial_data.get("city", ""), 
        state=initial_data.get("state", ""), 
        zip_code=initial_data.get("zip_code", "")
    )
    return {"address_result": result}

def enrichment_node(state: AgentState) -> dict:
    print("---AGENT ROLE: Information Enrichment---")
    url = state["initial_data"].get("website")
    
    if not url:
        return {"enrichment_data": {"status": "Skipped - No website provided"}}
    
    scraped_text = scrape_provider_website(url=url)
    
    if "error" in scraped_text.lower():
        return {"enrichment_data": {"error": "Failed to scrape website."}}
    
    extraction_prompt = f"""Extract education and board certifications from this text.
    Return ONLY a JSON object with keys: education (list), certifications (list).
    
    TEXT: {scraped_text[:4000]}
    
    Example format:
    {{"education": ["Harvard Medical School"], "certifications": ["Board Certified in Surgery"]}}
    """
    
    try:
        response = llm.invoke(extraction_prompt)
        parsed_data = extract_json_from_response(response.content)
        return {"enrichment_data": parsed_data}
    except Exception as e:
        print(f"Enrichment parsing error: {e}")
        return {"enrichment_data": {"error": f"Failed to parse enrichment data: {str(e)}"}}

# agent.py

def quality_assurance_node(state: AgentState) -> dict:
    print("---AGENT ROLE: Quality Assurance (With Surgical Logic)---")

    flags = []
    corrections = {}

    initial_data = state["initial_data"]

    # --- 1. SURGICAL ADDRESS VALIDATION ---
    input_address = initial_data.get("address", "")

    npi_address = ""
    for addr in state["npi_result"].get("addresses", []):
        if addr.get("address_purpose") == "LOCATION":
            npi_address = addr.get("address_1", "")
            break

    if npi_address:
        validation_result = validator.compare_addresses(input_address, npi_address)

        if validation_result["action"] == "AUTO_CORRECT":
            corrections["address"] = validation_result["new_value"]
            flags.append(f"AUTO-HEALED: {validation_result['reason']}")

        elif validation_result["action"] == "FLAG":
            flags.append(f"ADDRESS MISMATCH: {validation_result['reason']}")

    # --- 2. DATA HEALTH ---
    health_score = validator.calculate_data_health(
        last_updated_date=initial_data.get("last_updated", "2024-01-01"),
        source_type="CSV_UPLOAD",
        provider_type=state["npi_result"].get("enumeration_type", "NPI-1"),
    )

    corrections["data_health"] = health_score

    # --- 3. LICENSE CHECK ---
    license_number = initial_data.get("license_number", "").strip()
    if not license_number:
        flags.append("LICENSE ISSUE: Missing license number.")
    elif "SUSPENDED" in license_number.upper():
        flags.append("LICENSE ISSUE: License SUSPENDED.")

    return {
        "qa_flags": flags,
        "qa_corrections": corrections
    }


def synthesis_node(state: AgentState) -> dict:
    """Creates the final, standardized provider profile with robust JSON parsing."""
    print("---AGENT ROLE: Directory Management (Synthesis)---")
    
    max_attempts = 3
    
    for attempt in range(max_attempts):
        try:
            # Create a more structured prompt that emphasizes JSON-only output
            prompt = f"""You are a data synthesizer. Your task is to combine the following data into a single JSON object.

INPUT DATA:
Initial Data: {json.dumps(state['initial_data'], indent=2)}
NPI Result: {json.dumps(state['npi_result'], indent=2)}
Address Result: {json.dumps(state['address_result'], indent=2)}
Enrichment Data: {json.dumps(state['enrichment_data'], indent=2)}
QA Flags: {json.dumps(state['qa_flags'], indent=2)}

INSTRUCTIONS:
1. Combine all the data above into a single JSON object
2. Use keys: provider_name, npi, specialty, address, phone, website, npi_match_found, address_validation, education, certifications, qa_flags
3. Return ONLY the JSON object, no markdown, no explanation, no extra text

OUTPUT (JSON only):"""
            
            print(f"Synthesis attempt {attempt + 1}/{max_attempts}")
            response = llm.invoke(prompt)
            
            print(f"Raw LLM response (first 300 chars): {response.content[:300]}")
            
            # Use robust JSON extraction
            final_json = extract_json_from_response(response.content)
            
            print(f"✅ Successfully synthesized profile with keys: {list(final_json.keys())}")
            corrections = state.get("qa_corrections", {})
            if corrections:
                final_json.update(corrections)

            return {"final_profile": final_json}
            
        except json.JSONDecodeError as e:
            print(f"❌ JSON parsing error on attempt {attempt + 1}: {e}")
            print(f"   Problematic response: {response.content[:500]}")
        except Exception as e:
            print(f"❌ Synthesis attempt {attempt + 1} failed: {type(e).__name__}: {e}")
        
        # Wait before retry (only if not the last attempt)
        if attempt < max_attempts - 1:
            wait_time = 2 * (attempt + 1)  # 2, 4 seconds
            print(f"⏳ Waiting {wait_time}s before retry...")
            time.sleep(wait_time)
    
    # If all attempts fail, return a structured fallback
    print("⚠️ All synthesis attempts failed. Using fallback structure.")
    return {
        "final_profile": {
            "provider_name": state["initial_data"].get("full_name", "Unknown"),
            "npi": state["initial_data"].get("NPI"),
            "specialty": state["npi_result"].get("taxonomies", [{}])[0].get("desc") if state["npi_result"].get("taxonomies") else None,
            "address": state["initial_data"].get("address"),
            "phone": None,
            "website": state["initial_data"].get("website"),
            "npi_match_found": state["npi_result"].get("result_count", 0) > 0,
            "address_validation": state["address_result"],
            "enrichment_data": state["enrichment_data"],
            "qa_flags": state["qa_flags"],
            "synthesis_status": "fallback - LLM synthesis failed"
        }
    }

def confidence_scorer_node(state: AgentState) -> dict:
    """
    Advanced, production-grade confidence scoring.
    Multi-dimensional, explainable, decay-aware, risk-sensitive.
    SAFE for current pipeline.
    """
    print("---PIPELINE STEP: SCORING (ADVANCED)---")

    final_data = state.get("final_profile", {}) or {}
    initial_data = state.get("initial_data", {}) or {}
    qa_flags = state.get("qa_flags", []) or []

    logs = []
    total_score = 0.0

    # ===============================
    # WEIGHT CONFIGURATION (sum = 1.0)
    # ===============================
    WEIGHTS = {
        "identity": 0.30,
        "address": 0.22,
        "completeness": 0.18,
        "freshness": 0.10,
        "enrichment": 0.10,
        "risk": 0.10
    }

    # ===============================
    # 1️⃣ IDENTITY TRUST (NPI)
    # ===============================
    identity_raw = 1.0 if final_data.get("npi_match_found") else 0.0
    logs.append(
        "Identity ✔ NPI match" if identity_raw
        else "Identity ✖ NPI not found"
    )

    total_score += identity_raw * WEIGHTS["identity"]

    # ===============================
    # 2️⃣ ADDRESS RELIABILITY
    # ===============================
    address_raw = 0.0

    address_validation = (
        final_data.get("address_validation")
        or state.get("address_result")
    )

    verdict = None
    if isinstance(address_validation, dict):
        verdict = address_validation.get("verdict")
    elif isinstance(address_validation, str):
        verdict = address_validation

    if verdict == "High Confidence Match":
        address_raw = 1.0
        logs.append("Address ✔ High confidence match")
    elif verdict and "partial" in verdict.lower():
        address_raw = 0.65
        logs.append("Address ◐ Partial match")
    elif verdict:
        address_raw = 0.35
        logs.append("Address ⚠ Weak/uncertain match")
    else:
        logs.append("Address ✖ No validation data")

    total_score += address_raw * WEIGHTS["address"]

    # ===============================
    # 3️⃣ DATA COMPLETENESS
    # ===============================
    required_fields = [
        "provider_name",
        "npi",
        "specialty",
        "address",
        "phone",
        "website"
    ]

    present = sum(1 for f in required_fields if final_data.get(f))
    completeness_ratio = present / len(required_fields)

    logs.append(
        f"Completeness ℹ {present}/{len(required_fields)} fields present"
    )

    total_score += completeness_ratio * WEIGHTS["completeness"]

    # ===============================
    # 4️⃣ DATA FRESHNESS (DECAY)
    # ===============================
    freshness_raw = 0.6
    last_updated = initial_data.get("last_updated")

    if last_updated:
        try:
            last_dt = datetime.datetime.strptime(last_updated, "%Y-%m-%d")
            days_old = (datetime.datetime.utcnow() - last_dt).days
            freshness_raw = pow(2.71828, -days_old / 365)
            logs.append(
                f"Freshness ⏳ {days_old} days old "
                f"(decay={freshness_raw:.2f})"
            )
        except Exception:
            logs.append("Freshness ⚠ Invalid date format")

    total_score += freshness_raw * WEIGHTS["freshness"]

    # ===============================
    # 5️⃣ ENRICHMENT QUALITY
    # ===============================
    enrichment_raw = 0.0

    if final_data.get("website"):
        enrichment_raw += 0.4
    if final_data.get("education"):
        enrichment_raw += 0.3
    if final_data.get("certifications"):
        enrichment_raw += 0.3

    enrichment_raw = min(1.0, enrichment_raw)

    logs.append(f"Enrichment 🌐 score={enrichment_raw:.2f}")
    total_score += enrichment_raw * WEIGHTS["enrichment"]

    # ===============================
    # 6️⃣ RISK & PENALTIES
    # ===============================
    risk_penalty = 0.0

    if qa_flags:
        penalty = min(0.15, 0.04 * len(qa_flags))
        risk_penalty += penalty
        logs.append(f"Risk ⚠ {len(qa_flags)} QA flags (-{penalty*100:.0f}%)")

    if final_data.get("synthesis_status", "").startswith("fallback"):
        risk_penalty += 0.10
        logs.append("Risk ⚠ Fallback synthesis used (-10%)")

    total_score += max(0.0, WEIGHTS["risk"] - risk_penalty)

    # ===============================
    # FINAL NORMALIZATION
    # ===============================
    final_score = round(max(0.0, min(1.0, total_score)), 3)
    logs.append(f"FINAL CONFIDENCE = {final_score*100:.1f}%")

    return {
        "confidence_score": final_score,
        "log": logs
    }


# --- GRAPH CONSTRUCTION ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("npi_tool", call_npi_tool)
workflow.add_node("address_tool", call_address_tool)
workflow.add_node("enrichment", enrichment_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("quality_assurance", quality_assurance_node)
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


def run_agent_on_all_providers():
    providers = get_all_providers()
    results = []
    for provider in providers:
        initial_data = {
            "full_name": provider.get("full_name", ""),
            "NPI": provider.get("npi", ""),
            "address": provider.get("address", ""),
            "city": provider.get("city", ""),
            "state": provider.get("state", ""),
            "zip_code": provider.get("zip_code", "")
        }

        initial_state: AgentState = {
            "initial_data": initial_data,
            "log": [],
            "npi_result": {},
            "address_result": {},
            "enrichment_data": {},
            "qa_flags": [],
            "qa_corrections": {},   # ✅ ADD
            "final_profile": {},
            "confidence_score": 0.0
        }

        final_state = app.invoke(initial_state)
        results.append(final_state)
    return results

if __name__ == "__main__":
    from provider_requests import get_all_providers

    providers = get_all_providers()
    for provider in providers[:10]:  # limit to first 10 for testing
        initial_state: AgentState = {
            "initial_data": {
                "full_name": provider.get("fullName", ""),
                "NPI": provider.get("npi", ""),
                "address": provider.get("address", ""),
                "city": provider.get("city", ""),
                "state": provider.get("state", ""),
                "zip_code": provider.get("zipCode", "")
            },
            "log": [],
            "npi_result": {},
            "address_result": {},
            "enrichment_data": {},
            "qa_flags": [],
            "qa_corrections": {},   # ✅ ADD
            "final_profile": {},
            "confidence_score": 0.0
        }

        final_state = app.invoke(initial_state)
        print(final_state["final_profile"])
        print("Confidence:", final_state["confidence_score"])
        print("-" * 50)
