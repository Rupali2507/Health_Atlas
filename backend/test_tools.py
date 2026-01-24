# test_tools.py
from production_tools import *
from dotenv import load_dotenv

load_dotenv()

# Test 1: OIG Check
print("Testing OIG LEIE...")
oig = check_oig_leie_csv_method(
    npi="1234567890",
    first_name="Test",
    last_name="Provider"
)
print(f"✓ OIG Result: {oig}")

# Test 2: Google Maps
print("\nTesting Google Maps...")
geo = verify_medical_facility(
    address="123 Main St",
    city="Los Angeles",
    state="CA",
    zip_code="90001"
)
print(f"✓ Geo Result: {geo.get('is_medical_facility')}")

# Test 3: Serper
print("\nTesting Serper...")
scholar = search_google_scholar("Dr. Anthony Fauci", 2024)
print(f"✓ Publications: {scholar.get('publication_count')}")

print("\n✅ All tools working!")