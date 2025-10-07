# backend/_test_agent.py
import pandas as pd
import json
from agent import app as validation_agent_app

def run_test():
    try:
        df = pd.read_csv("Sample_Data/input_test_data.csv", dtype=str)
        provider_info = df.iloc[0].to_dict()
        print("--- Input Data for Test ---")
        print(json.dumps(provider_info, indent=2))
        print("-" * 25)
    except FileNotFoundError:
        print("ERROR: Sample_Data/input_test_data.csv not found.")
        return

    # The initial state is now very simple
    initial_state = {
        "initial_data": provider_info,
        "log": []
    }

    print("🚀 Invoking agent pipeline...")
    final_result = validation_agent_app.invoke(initial_state)
    print("✅ Pipeline finished.")
    print("-" * 25)

    print("--- Final Agent Output ---")
    print("Confidence Score:", final_result.get("confidence_score"))
    print("\nFinal Profile:")
    print(json.dumps(final_result.get("final_profile", {}), indent=2))
    print("\nLog:")
    for entry in final_result.get("log", []):
        print(entry)

if __name__ == "__main__":
    run_test()