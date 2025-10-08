import pandas as pd
import json
from agent import app as validation_agent_app

def run_test():
    provider_info = {
        "NPI": "1992757090",
        "full_name": "Dr. Robert Ackerman",
        "address": "9500 Euclid Ave", # Correct Address
        # "address": "123 Fake Street", # Uncomment this line to test the QA flag
        "city": "Cleveland",
        "state": "OH",
        "zip_code": "44195",
        "website": "https://my.clevelandclinic.org/staff/9953-robert-ackerman"
    }
    initial_state = {"initial_data": provider_info, "log": []}

    print("🚀 Invoking full agent pipeline...")
    final_result = validation_agent_app.invoke(initial_state)
    print("✅ Pipeline finished.")
    print("-" * 25)

    print("--- Final Agent Output ---")
    print("Confidence Score:", final_result.get("confidence_score"))
    print("\nQA Flags:", final_result.get("qa_flags"))
    print("\nFinal Profile:")
    print(json.dumps(final_result.get("final_profile", {}), indent=2))
    print("\nLog:")
    for entry in final_result.get("log", []):
        print(entry)

if __name__ == "__main__":
    run_test()