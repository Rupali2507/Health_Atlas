import os
import json
from agent import app as validation_agent_app

def run_test():
    """
    Tests the full, upgraded agent pipeline with a provider from California
    to demonstrate the real state license check and all other features.
    """
    
    # This provider data is designed to test every feature:
    # - It includes a title ("Dr.") to test our name parsing.
    # - It's from California ("CA") to test the real license scraper.
    # - It includes a phone number and website.
    provider_info = {
        "NPI": "1235256050", # A real NPI for a CA provider
        "full_name": "Dr. John Smith", # Using a common name to test search
        "address": "1200 N State St",
        "city": "Los Angeles",
        "state": "CA",
        "zip_code": "90033",
        "phone_number": "3234098595",
        "website": "https://www.keckmedicine.org/providers/john-smith/" # Example website
    }

    print("--- Input Data for Final Test ---")
    print(json.dumps(provider_info, indent=2))
    print("-" * 25)

    # The initial state must now include all fields from the AgentState
    initial_state = {
        "initial_data": provider_info,
        "log": [],
        "npi_result": {},
        "address_result": {},
        "phone_result": {},
        "license_result": {},
        "enrichment_data": {},
        "qa_flags": [],
        "final_profile": {},
        "confidence_score": 0.0
    }

    print("🚀 Invoking full agent pipeline...")
    final_result = validation_agent_app.invoke(initial_state)
    print("✅ Pipeline finished.")
    print("-" * 25)

    print("--- Final Agent Output ---")
    print("Confidence Score:", final_result.get("confidence_score"))
    
    print("\nQA Flags:")
    print(json.dumps(final_result.get("qa_flags", []), indent=2))

    print("\nFinal Profile:")
    print(json.dumps(final_result.get("final_profile", {}), indent=2))
    
    print("\nLog:")
    for entry in final_result.get("log", []):
        print(entry)

if __name__ == "__main__":
    run_test()