import os
import json
import re
print("DEBUG: Starting agent.py imports...")

# --- This block is a placeholder for your actual imports ---
# It's possible an error is happening in one of these imports.
try:
    import network_fix
    from typing import TypedDict, List
    from langchain_groq import ChatGroq
    from langgraph.graph import StateGraph, END
    from dotenv import load_dotenv
    from thefuzz import fuzz
    import time
    print("DEBUG: Core imports successful.")

    from tools import search_npi_registry, validate_address, scrape_provider_website, validate_phone_number
    print("DEBUG: Imported from tools.py.")

    from mock_license_tool import check_state_license
    print("DEBUG: Imported from mock_license_tool.py.")
except ImportError as e:
    print(f"FATAL ERROR DURING IMPORT: {e}")
    # Exit here if an import fails, to make the error obvious
    raise 

load_dotenv()
print("DEBUG: load_dotenv() called.")

# --- AGENT STATE ---
class AgentState(TypedDict):
    initial_data: dict
    log: List[str]
    npi_result: dict
    address_result: dict
    phone_result: dict
    license_result: dict
    enrichment_data: dict
    qa_flags: List[str]
    final_profile: dict
    confidence_score: float
print("DEBUG: AgentState defined.")

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
print("DEBUG: LLM initialized.")

def extract_json_from_response(text: str):
    if not text or not text.strip(): raise ValueError("Empty response")
    text = re.sub(r'```json\s*', '', text); text = re.sub(r'```\s*', '', text); text = text.strip()
    first_brace = text.find('{'); last_brace = text.rfind('}')
    if first_brace == -1 or last_brace == -1: raise ValueError("No JSON found")
    json_str = text[first_brace:last_brace + 1]
    return json.loads(json_str)
print("DEBUG: Helper functions defined.")


# --- PIPELINE NODES ---
def call_npi_tool(state: AgentState) -> dict:
    print("---AGENT ROLE: Data Validation (NPI Check)---")
    initial_data = state["initial_data"]; full_name = initial_data.get("full_name", ""); titles_to_remove = ["DR.", "DR", "MD"]; name_parts = [p for p in full_name.strip().split() if p.upper().replace('.', '') not in titles_to_remove]
    first_name = name_parts[0] if name_parts else ""; last_name = name_parts[-1] if len(name_parts) > 1 else ""
    npi_number = initial_data.get("NPI", ""); st = initial_data.get("state", "")
    return {"npi_result": search_npi_registry(first_name=first_name, last_name=last_name, npi_number=npi_number, state=st)}

def call_address_tool(state: AgentState) -> dict:
    print("---AGENT ROLE: Data Validation (Address Check)---")
    initial_data = state["initial_data"]
    return {"address_result": validate_address(address=initial_data.get("address", ""), city=initial_data.get("city", ""), state=initial_data.get("state", ""), zip_code=initial_data.get("zip_code", ""))}

def call_phone_tool(state: AgentState) -> dict:
    print("---AGENT ROLE: Data Validation (Phone Check)---")
    initial_data = state["initial_data"]
    return {"phone_result": validate_phone_number(phone_number=initial_data.get("phone_number", ""))}

def call_license_tool(state: AgentState) -> dict:
    print("---AGENT ROLE: Data Validation (License Check)---")
    initial_data = state["initial_data"]
    full_name = initial_data.get("full_name", "")
    titles_to_remove = ["DR.", "DR", "MD"]
    name_parts = [p for p in full_name.strip().split() if p.upper().replace('.', '') not in titles_to_remove]
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    st = initial_data.get("state", "")
    return {"license_result": check_state_license(first_name=first_name, last_name=last_name, state=st)}

def enrichment_node(state: AgentState) -> dict:
    print("---AGENT ROLE: Information Enrichment---")
    url = state["initial_data"].get("website")
    if not url: return {"enrichment_data": {"status": "Skipped"}}
    scraped_text = scrape_provider_website(url=url)
    if "error" in scraped_text.lower(): return {"enrichment_data": {"error": "Failed to scrape website."}}
    extraction_prompt = f"From this text, extract education and board certifications as JSON.\nTEXT: {scraped_text[:4000]}"
    try:
        response = llm.invoke(extraction_prompt)
        return {"enrichment_data": extract_json_from_response(response.content)}
    except Exception as e:
        return {"enrichment_data": {"error": f"Failed to parse: {e}"}}

def quality_assurance_node(state: AgentState) -> dict:
    print("---AGENT ROLE: Quality Assurance---")
    flags = []
    initial_address = state["initial_data"].get("address", "").upper(); npi_addresses = state["npi_result"].get("addresses", [])
    npi_loc_address = ""
    for addr in npi_addresses:
        if addr.get("address_purpose") == "LOCATION": npi_loc_address = addr.get("address_1", "").upper(); break
    if npi_loc_address and fuzz.partial_ratio(initial_address, npi_loc_address) < 70:
        flags.append(f"ADDRESS MISMATCH: Initial: '{initial_address}', NPI: '{npi_loc_address}'.")
    if not state.get("phone_result", {}).get("is_valid_format", True):
        flags.append(f"INVALID PHONE: '{state['initial_data'].get('phone_number')}' has an invalid format.")
    license_status = state.get("license_result", {}).get("status")
    if license_status not in ["Active", "Unsupported State"]:
        flags.append(f"LICENSE ALERT: Could not verify an active license. Status: {license_status}")
    return {"qa_flags": flags}

def synthesis_node(state: AgentState) -> dict:
    print("---AGENT ROLE: Directory Management (Synthesis)---")
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            prompt = f"Synthesize all data into a single JSON. Initial: {json.dumps(state['initial_data'])} NPI: {json.dumps(state['npi_result'])} Address: {json.dumps(state['address_result'])} Phone: {json.dumps(state['phone_result'])} License: {json.dumps(state['license_result'])} Enrichment: {json.dumps(state['enrichment_data'])} QA: {json.dumps(state['qa_flags'])} Return ONLY the JSON."
            response = llm.invoke(prompt)
            return {"final_profile": extract_json_from_response(response.content)}
        except Exception as e:
            print(f"Synthesis attempt {attempt + 1} failed: {e}. Retrying...")
            time.sleep(2)
    return {"final_profile": {"error": "Synthesis failed."}}

def confidence_scorer_node(state: AgentState) -> dict:
    print("---PIPELINE STEP: SCORING---")
    score = 0.0; log = []; final_data = state.get("final_profile", {}); 
    if not final_data.get("error"):
        if final_data.get("npi_match_found", True) and "error" not in str(state.get("npi_result")): score += 0.5; log.append("Score +0.5 (NPI Match)")
        if "address_validation" in final_data:
            verdict = final_data.get("address_validation", {}).get("verdict")
            if verdict == "High Confidence Match": score += 0.3; log.append("Score +0.3 (Address: High Conf)")
        if state.get("phone_result", {}).get("is_valid_format"): score += 0.05; log.append("Score +0.05 (Valid Phone)")
        if state.get("license_result", {}).get("status") == "Active": score += 0.1; log.append("Score +0.1 (License Verified)")
        if state.get("qa_flags"): score -= 0.4; log.append(f"Score -0.4 (QA Flags: {len(state['qa_flags'])})")
    final_score = max(0.0, min(1.0, score))
    return {"confidence_score": final_score, "log": log}
print("DEBUG: All pipeline nodes defined.")

# --- GRAPH CONSTRUCTION ---
workflow = StateGraph(AgentState)
print("DEBUG: StateGraph initialized.")

workflow.add_node("npi_tool", call_npi_tool)
workflow.add_node("address_tool", call_address_tool)
workflow.add_node("phone_tool", call_phone_tool)
workflow.add_node("license_tool", call_license_tool)
workflow.add_node("enrichment", enrichment_node)
workflow.add_node("quality_assurance", quality_assurance_node)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("scorer", confidence_scorer_node)
print("DEBUG: All nodes added to workflow.")

workflow.set_entry_point("npi_tool")
workflow.add_edge("npi_tool", "address_tool")
workflow.add_edge("address_tool", "phone_tool")
workflow.add_edge("phone_tool", "license_tool")
workflow.add_edge("license_tool", "enrichment")
workflow.add_edge("enrichment", "quality_assurance")
workflow.add_edge("quality_assurance", "synthesis")
workflow.add_edge("synthesis", "scorer")
workflow.add_edge("scorer", END)
print("DEBUG: All edges defined.")

app = workflow.compile()
print("DEBUG: Workflow compiled successfully. 'app' is created.")