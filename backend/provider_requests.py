import requests

BASE_URL = "http://localhost:8080/api/csv"

# fetch all providers

def get_all_providers():
    url = f"{BASE_URL}/datamodels"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching providers: {e}")
        return []

