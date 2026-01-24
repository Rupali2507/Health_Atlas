import requests
from datetime import datetime
from pathlib import Path

# backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# backend/Sample_Data/
OUTPUT_DIR = BASE_DIR / "Sample_Data"
OUTPUT_DIR.mkdir(exist_ok=True)

OUTPUT_FILE = OUTPUT_DIR / "oig_leie_database.csv"

def update_oig_database():
    url = "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv"
    response = requests.get(url, timeout=60)
    response.raise_for_status()

    with open(OUTPUT_FILE, "wb") as f:
        f.write(response.content)

    print(f"OIG LEIE database updated at {datetime.now()}")
    print(f"Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    update_oig_database()
