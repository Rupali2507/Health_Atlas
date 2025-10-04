# backend/agent.py
import os
import json
from typing import TypedDict, Annotated, List
from langchain_core.tools import tool
from langchain_core.messages import BaseMessage
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from dotenv import load_dotenv
from thefuzz import fuzz

# --- Import and Decorate Tools ---
from tools import search_npi_registry, parse_pdf_with_vlm, scrape_website_for_text, validate_address

load_dotenv()

# --- TOOL DEFINITIONS ---

@tool
def npi_registry_tool(full_name: str, state: str) -> str:
    """
    Searches the NPI registry for a provider using their full name and state.
    The full name should be the provider's complete name.
    """
    name_parts = full_name.strip().split()
    first_name = name_parts[0] if name_parts else ""
    last_name = name_parts[-1] if len(name_parts) > 1 else ""
    if not first_name or not last_name:
        return json.dumps({"error": "Could not determine a first and last name from the provided full_name."})
    return search_npi_registry(first_name=first_name, last_name=last_name, state=state)

@tool
def pdf_parser_tool(pdf_path: str) -> str:
    """Parses a PDF document to extract text and tables using a VLM."""
    return parse_pdf_with_vlm(pdf_path=pdf_path)

@tool
def web_scraper_tool(url: str) -> str:
    """Scrapes a website to extract all visible text content."""
    return scrape_website_for_text(url=url)

@tool
# ✅ CHANGED: Changed 'list' to 'List[str]' for the address_lines parameter
def address_validator_tool(address_lines: List[str], region_code: str, locality: str, postal_code: str) -> str:
    """Validates a physical address using the Google Maps Address Validation API."""
    return validate_address(address_lines, region_code, locality, postal_code)

tools = [npi_registry_tool, pdf_parser_tool, web_scraper_tool, address_validator_tool]

# --- AGENT STATE ---
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    log: List[str]
    initial_data: dict
    final_profile: dict
    confidence_score: float

# --- AGENT NODES ---

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
llm_with_tools = llm.bind_tools(tools)

def agent_node(state: AgentState):
    """Invokes the LLM to decide the next action or respond."""
    print("---AGENT NODE---")
    response = llm_with_tools.invoke(state['messages'])
    return {"messages": [response], "log": state['log'] + [f"Agent decided: {response.tool_calls}"]}

tool_node = ToolNode(tools)

def confidence_scorer_node(state: AgentState) -> dict:
    """Calculates a heuristic confidence score based on the agent's findings."""
    print("---SCORER NODE---")
    score = 0.0
    log = state.get('log', [])
    final_data_str = state['messages'][-1].content
    try:
        final_data = json.loads(final_data_str)
    except json.JSONDecodeError:
        final_data = {}
        log.append("Warning: Could not decode final JSON from AI message.")
    initial_data = state.get("initial_data", {})
    if final_data.get("npi_match_found", False):
        score += 0.5
        log.append("Score +0.5 (NPI Match Found)")
    if "npi_data" in final_data and initial_data:
        npi_name = final_data.get("npi_data", {}).get("basic", {}).get("name", "")
        initial_name = initial_data.get('full_name', "")
        if initial_name and npi_name:
            name_similarity = fuzz.token_set_ratio(initial_name, npi_name)
            if name_similarity > 80:
                similarity_bonus = 0.2 * (name_similarity / 100)
                score += similarity_bonus
                log.append(f"Score +{similarity_bonus:.2f} (Name Similarity: {name_similarity}%)")
    if "address_validation" in final_data:
        granularity = final_data.get("address_validation", {}).get("verdict", {}).get("validation_granularity")
        if granularity == "PREMISE":
            score += 0.2
            log.append("Score +0.2 (Address validated to PREMISE level)")
        elif granularity == "ROUTE":
            score += 0.1
            log.append("Score +0.1 (Address validated to ROUTE level)")
    final_score = max(0.0, min(1.0, score))
    return {"confidence_score": final_score, "log": log, "final_profile": final_data}

# --- GRAPH CONSTRUCTION ---
workflow = StateGraph(AgentState)
workflow.add_node("agent", agent_node)
workflow.add_node("call_tool", tool_node)
workflow.add_node("scorer", confidence_scorer_node)
workflow.set_entry_point("agent")

def router(state: AgentState):
    """Routes the agent to the correct next step."""
    if state["messages"][-1].tool_calls:
        return "call_tool"
    return "scorer"

workflow.add_conditional_edges("agent", router)
workflow.add_edge("call_tool", "agent")
workflow.add_edge("scorer", END)
app = workflow.compile()
