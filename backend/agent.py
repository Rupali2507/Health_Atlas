import os
import json
from typing import TypedDict, Annotated, List
from langchain_core.messages import BaseMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv
from thefuzz import fuzz

from tools import search_npi_registry, validate_address

load_dotenv()

class AgentState(TypedDict):
    initial_data: dict
    log: List[str]
    npi_result: dict
    address_result: dict
    final_profile: dict
    confidence_score: float


llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)


def call_npi_tool(state: AgentState) -> dict:
    """First step: Call the NPI Registry tool."""
    print("---PIPELINE STEP 1: CALLING NPI TOOL---")
    initial_data = state["initial_data"]
    
    name_parts = initial_data.get("full_name", "").strip().split()
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    npi_number = initial_data.get("NPI", "")
    st = initial_data.get("state", "")

    result = search_npi_registry(first_name=first_name, last_name=last_name, npi_number=npi_number)
    log_entry = f"NPI tool called. Result: {json.dumps(result)}"
    
    return {"npi_result": result, "log": state['log'] + [log_entry]}

def call_address_tool(state: AgentState) -> dict:
    """Second step: Call the Address Validation tool."""
    print("---PIPELINE STEP 2: CALLING ADDRESS TOOL---")
    initial_data = state["initial_data"]

    result = validate_address(
        address=initial_data.get("address", ""),
        city=initial_data.get("city", ""),
        state=initial_data.get("state", ""),
        zip_code=initial_data.get("zip_code", "")
    )
    log_entry = f"Address tool called. Result: {json.dumps(result)}"

    return {"address_result": result, "log": state['log'] + [log_entry]}

def synthesis_node(state: AgentState) -> dict:
    """Third step: Ask the LLM to synthesize the results into the final JSON."""
    print("---PIPELINE STEP 3: SYNTHESIZING RESULTS---")
    
    prompt = f"""
    You are a data synthesis robot.
    Based on the initial data and the results from two tools, create a single, clean JSON object.
    
    Initial Data: {json.dumps(state['initial_data'])}
    NPI Tool Result: {json.dumps(state['npi_result'])}
    Address Tool Result: {json.dumps(state['address_result'])}

    Synthesize this information into the following JSON format. Your response MUST be ONLY the JSON object.

    Example Output Format:
    {{
      "npi_match_found": true,
      "npi_data": {{ ... NPI Tool Result ... }},
      "address_validation": {{ ... Address Tool Result ... }},
      "final_verified_profile": {{
        "full_name": "...",
        "npi": "...",
        "address": "...",
        "city": "...",
        "state": "...",
        "zip_code": "..."
      }}
    }}
    """
    
    response = llm.invoke(prompt)
    log_entry = "Synthesis complete."
    
    try:
        final_json = json.loads(response.content)
        return {"final_profile": final_json, "log": state['log'] + [log_entry]}
    except json.JSONDecodeError:
        log_entry = "ERROR: Failed to decode final JSON from LLM."
        return {"final_profile": {"error": "Synthesis failed"}, "log": state['log'] + [log_entry]}


def confidence_scorer_node(state: AgentState) -> dict:
    """Final step: Calculate the confidence score based on the clean results."""
    print("---PIPELINE STEP 4: SCORING---")
    score = 0.0
    log = state.get('log', [])
    final_data = state.get("final_profile", {})
    initial_data = state.get("initial_data", {})

    if final_data.get("npi_match_found"):
        score += 0.5
        log.append("Score +0.5 (NPI Match Found)")

    if "npi_data" in final_data and "basic" in final_data["npi_data"]:
        npi_name = final_data["npi_data"]["basic"].get("name", "")
        initial_name = initial_data.get('full_name', "")
        if initial_name and npi_name:
            name_similarity = fuzz.token_set_ratio(initial_name.upper(), npi_name.upper())
            if name_similarity > 80:
                similarity_bonus = 0.2 * (name_similarity / 100)
                score += similarity_bonus
                log.append(f"Score +{similarity_bonus:.2f} (Name Similarity: {name_similarity}%)")

    if "address_validation" in final_data:
        verdict = final_data["address_validation"].get("verdict")
        if verdict == "High Confidence Match":
            score += 0.3
            log.append("Score +0.3 (Address: High Confidence Match)")
        elif verdict == "Medium Confidence Match":
            score += 0.15
            log.append("Score +0.15 (Address: Medium Confidence Match)")

    final_score = max(0.0, min(1.0, score))
    return {"confidence_score": final_score, "log": log}


workflow = StateGraph(AgentState)
workflow.add_node("npi_tool", call_npi_tool)
workflow.add_node("address_tool", call_address_tool)
workflow.add_node("synthesis", synthesis_node)
workflow.add_node("scorer", confidence_scorer_node)

workflow.set_entry_point("npi_tool")
workflow.add_edge("npi_tool", "address_tool")
workflow.add_edge("address_tool", "synthesis")
workflow.add_edge("synthesis", "scorer")
workflow.add_edge("scorer", END)

app = workflow.compile()
