"""
Production-Ready Tools for Healthcare Provider Verification
============================================================

Installation Requirements:
pip install requests beautifulsoup4 selenium googlemaps serper-python python-dotenv

Environment Variables (.env file):
SERPER_API_KEY=your_serper_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_key_here
"""

import requests
import os
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import googlemaps
import time
import re
from typing import Dict, Optional, List
from datetime import datetime

# ============================================
# 1. OIG LEIE EXCLUSION CHECK
# ============================================

def check_oig_leie_exclusion(npi: str = None, first_name: str = None, last_name: str = None) -> dict:
    """
    Check OIG List of Excluded Individuals/Entities (LEIE)
    
    Official API: https://oig.hhs.gov/exclusions/exclusions_list.asp
    
    Returns:
        dict: {
            "is_excluded": bool,
            "exclusion_details": dict or None,
            "check_date": str
        }
    """
    print(f"  🔍 Checking OIG LEIE for: {first_name} {last_name} (NPI: {npi})")
    
    # Method 1: Use OIG's search form (web scraping)
    # Note: OIG doesn't have a public API, so we scrape their search results
    
    try:
        # OIG LEIE downloadable database (updated monthly)
        # Download from: https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv
        
        base_url = "https://exclusions.oig.hhs.gov/search.aspx"
        
        # For production: Download and cache the CSV file monthly
        # For now, we'll use the web search
        
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Step 1: Get the search form
        response = session.get(base_url, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Step 2: Extract form tokens (ASP.NET ViewState)
        viewstate = soup.find('input', {'name': '__VIEWSTATE'})
        viewstate_value = viewstate['value'] if viewstate else ''
        
        # Step 3: Submit search
        search_data = {
            '__VIEWSTATE': viewstate_value,
            'ctl00$cpExclusions$txtFirstName': first_name or '',
            'ctl00$cpExclusions$txtLastName': last_name or '',
            'ctl00$cpExclusions$txtNPI': npi or '',
            'ctl00$cpExclusions$btnSearch': 'Search'
        }
        
        search_response = session.post(base_url, data=search_data, timeout=10)
        search_soup = BeautifulSoup(search_response.content, 'html.parser')
        
        # Step 4: Parse results
        results_table = search_soup.find('table', {'class': 'gridview'})
        
        if results_table:
            # Found exclusion record(s)
            rows = results_table.find_all('tr')[1:]  # Skip header
            
            if rows:
                # Parse first match
                cells = rows[0].find_all('td')
                
                exclusion_details = {
                    "name": cells[0].text.strip() if len(cells) > 0 else '',
                    "exclusion_type": cells[1].text.strip() if len(cells) > 1 else '',
                    "exclusion_date": cells[2].text.strip() if len(cells) > 2 else '',
                    "reinstatement_date": cells[3].text.strip() if len(cells) > 3 else '',
                    "waiver_state": cells[4].text.strip() if len(cells) > 4 else ''
                }
                
                print(f"  ❌ EXCLUSION FOUND: {exclusion_details['exclusion_type']}")
                
                return {
                    "is_excluded": True,
                    "exclusion_details": exclusion_details,
                    "check_date": datetime.now().isoformat(),
                    "source": "OIG LEIE Web Search"
                }
        
        # No exclusions found
        print(f"  ✅ No OIG exclusions found")
        return {
            "is_excluded": False,
            "exclusion_details": None,
            "check_date": datetime.now().isoformat(),
            "source": "OIG LEIE Web Search"
        }
        
    except Exception as e:
        print(f"  ⚠️ OIG check failed: {e}")
        return {
            "is_excluded": None,  # Unknown status
            "error": str(e),
            "check_date": datetime.now().isoformat()
        }


def check_oig_leie_csv_method(npi: str = None, first_name: str = None, last_name: str = None) -> dict:
    """
    Alternative: Check against downloaded OIG LEIE CSV file (RECOMMENDED FOR PRODUCTION)
    
    Download monthly from: https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv
    
    This is MUCH faster than web scraping for batch processing.
    """
    import pandas as pd
    
    csv_path = "oig_leie_database.csv"  # Download and save locally
    
    try:
        # Download if not exists
        if not os.path.exists(csv_path):
            print("  📥 Downloading OIG LEIE database...")
            download_url = "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv"
            response = requests.get(download_url, timeout=30)
            
            with open(csv_path, 'wb') as f:
                f.write(response.content)
            print("  ✅ Database downloaded")
        
        # Load and search
        df = pd.read_csv(csv_path, low_memory=False)
        
        # Search by NPI first (most accurate)
        if npi:
            matches = df[df['NPI'] == npi]
        else:
            # Fallback: Search by name
            matches = df[
                (df['FIRSTNAME'].str.upper() == (first_name or '').upper()) &
                (df['LASTNAME'].str.upper() == (last_name or '').upper())
            ]
        
        if not matches.empty:
            record = matches.iloc[0]
            
            exclusion_details = {
                "name": f"{record.get('FIRSTNAME', '')} {record.get('LASTNAME', '')}",
                "exclusion_type": record.get('EXCLTYPE', ''),
                "exclusion_date": record.get('EXCLDATE', ''),
                "reinstatement_date": record.get('REINDATE', ''),
                "waiver_state": record.get('WAIVERSTATE', ''),
                "specialty": record.get('SPECIALTY', '')
            }
            
            print(f"  ❌ EXCLUSION FOUND in CSV: {exclusion_details['exclusion_type']}")
            
            return {
                "is_excluded": True,
                "exclusion_details": exclusion_details,
                "check_date": datetime.now().isoformat(),
                "source": "OIG LEIE CSV Database"
            }
        
        print(f"  ✅ No exclusions found in CSV database")
        return {
            "is_excluded": False,
            "exclusion_details": None,
            "check_date": datetime.now().isoformat(),
            "source": "OIG LEIE CSV Database"
        }
        
    except Exception as e:
        print(f"  ⚠️ CSV check failed: {e}")
        return {"is_excluded": None, "error": str(e)}


# ============================================
# 2. STATE MEDICAL BOARD LICENSE VERIFICATION
# ============================================

def verify_california_medical_board(license_number: str, last_name: str) -> dict:
    """
    Example: California Medical Board Verification
    Website: https://search.dca.ca.gov/
    
    Each state has different formats - this is a template.
    """
    print(f"  🏛️ Checking California Medical Board: {license_number}")
    
    try:
        # Setup headless Chrome
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=chrome_options)
        
        # Navigate to search page
        driver.get("https://search.dca.ca.gov/")
        
        # Wait for page load
        wait = WebDriverWait(driver, 10)
        
        # Select "Medical Board of California"
        board_select = wait.until(
            EC.presence_of_element_located((By.ID, "boardCode"))
        )
        board_select.send_keys("Medical Board of California")
        
        # Enter license number
        license_input = driver.find_element(By.ID, "licenseNumber")
        license_input.send_keys(license_number)
        
        # Click search
        search_button = driver.find_element(By.ID, "searchButton")
        search_button.click()
        
        # Wait for results
        time.sleep(3)
        
        # Parse results
        result_div = driver.find_element(By.CLASS_NAME, "license-details")
        
        # Extract status
        status_element = result_div.find_element(By.XPATH, "//dt[text()='Status']/following-sibling::dd[1]")
        status = status_element.text.strip()
        
        # Extract expiration
        exp_element = result_div.find_element(By.XPATH, "//dt[text()='Expiration Date']/following-sibling::dd[1]")
        expiration = exp_element.text.strip()
        
        # Check for disciplinary actions
        disciplinary_actions = []
        try:
            discipline_section = driver.find_element(By.CLASS_NAME, "disciplinary-actions")
            actions = discipline_section.find_elements(By.TAG_NAME, "li")
            disciplinary_actions = [action.text for action in actions]
        except:
            pass  # No disciplinary actions
        
        driver.quit()
        
        print(f"  ✅ License Status: {status} (Expires: {expiration})")
        
        return {
            "status": status,
            "license_number": license_number,
            "expiration_date": expiration,
            "disciplinary_actions": disciplinary_actions,
            "check_date": datetime.now().isoformat(),
            "source": "California Medical Board"
        }
        
    except Exception as e:
        print(f"  ⚠️ CA Medical Board check failed: {e}")
        if 'driver' in locals():
            driver.quit()
        return {"status": "Unknown", "error": str(e)}


def verify_state_license_universal(state_code: str, license_number: str, 
                                   provider_name: str) -> dict:
    """
    Universal state license checker (requires state-specific configuration)
    
    For production, you'll need to implement each state's specific scraper.
    States without online lookup will require manual verification.
    """
    
    # State-specific scrapers
    state_scrapers = {
        "CA": verify_california_medical_board,
        # Add more states:
        # "NY": verify_new_york_medical_board,
        # "TX": verify_texas_medical_board,
        # etc.
    }
    
    scraper_func = state_scrapers.get(state_code)
    
    if scraper_func:
        return scraper_func(license_number, provider_name.split()[-1])
    else:
        print(f"  ⚠️ No automated scraper for state: {state_code}")
        return {
            "status": "Manual Verification Required",
            "state": state_code,
            "license_number": license_number,
            "note": f"State {state_code} requires manual verification"
        }


# ============================================
# 3. GOOGLE SCHOLAR SEARCH (SERPER API)
# ============================================

def search_google_scholar(provider_name: str, year_min: int = 2024) -> dict:
    """
    Search Google Scholar for recent publications using Serper API
    
    Get API key from: https://serper.dev/
    Free tier: 2,500 searches/month
    """
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("SERPER_API_KEY")
    
    if not api_key:
        return {"error": "SERPER_API_KEY not found in .env file"}
    
    print(f"  📚 Searching Google Scholar for: {provider_name}")
    
    try:
        url = "https://google.serper.dev/scholar"
        
        payload = {
            "q": f'"{provider_name}"',
            "num": 10,
            "tbs": f"cdr:1,cd_min:1/1/{year_min},cd_max:12/31/2025"  # Date range
        }
        
        headers = {
            'X-API-KEY': api_key,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        
        publications = []
        
        if 'organic' in data:
            for result in data['organic']:
                publications.append({
                    "title": result.get("title", ""),
                    "snippet": result.get("snippet", ""),
                    "publication_info": result.get("publicationInfo", ""),
                    "cited_by": result.get("citedBy", 0),
                    "link": result.get("link", "")
                })
        
        print(f"  ✅ Found {len(publications)} recent publications")
        
        return {
            "publication_count": len(publications),
            "publications": publications,
            "search_date": datetime.now().isoformat(),
            "query": f'"{provider_name}"'
        }
        
    except Exception as e:
        print(f"  ⚠️ Google Scholar search failed: {e}")
        return {"error": str(e), "publication_count": 0}


# ============================================
# 4. GEO-VERIFICATION (GOOGLE MAPS API)
# ============================================

def verify_medical_facility(address: str, city: str, state: str, zip_code: str) -> dict:
    """
    Verify if address is a medical facility using Google Maps Places API
    
    Get API key from: https://console.cloud.google.com/
    Enable: Maps JavaScript API, Places API, Geocoding API
    """
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        return {"error": "GOOGLE_MAPS_API_KEY not found in .env file"}
    
    full_address = f"{address}, {city}, {state} {zip_code}"
    print(f"  📍 Geo-verifying: {full_address}")
    
    try:
        gmaps = googlemaps.Client(key=api_key)
        
        # Step 1: Geocode the address
        geocode_result = gmaps.geocode(full_address)
        
        if not geocode_result:
            print(f"  ❌ Address not found in Google Maps")
            return {
                "is_medical_facility": False,
                "facility_type": "Address Not Found",
                "confidence": 0.0
            }
        
        location = geocode_result[0]['geometry']['location']
        formatted_address = geocode_result[0]['formatted_address']
        
        # Step 2: Places Nearby Search
        places_result = gmaps.places_nearby(
            location=location,
            radius=50,  # 50 meters
            type='health'  # Medical facility type
        )
        
        # Step 3: Check if exact location is medical
        is_medical = False
        facility_type = "Unknown"
        place_types = []
        
        if places_result['results']:
            # Get the first result (closest match)
            place = places_result['results'][0]
            place_types = place.get('types', [])
            
            medical_types = [
                'doctor', 'hospital', 'health', 'dentist', 
                'physiotherapist', 'pharmacy', 'medical_lab'
            ]
            
            is_medical = any(t in place_types for t in medical_types)
            
            if is_medical:
                facility_type = "Medical Facility"
                print(f"  ✅ Confirmed medical facility: {place.get('name', 'Unknown')}")
            else:
                facility_type = "Non-Medical"
                print(f"  ⚠️ Location is: {', '.join(place_types[:3])}")
        
        # Step 4: Additional fraud checks
        fraud_indicators = []
        
        # Check if residential
        if 'street_address' in geocode_result[0].get('types', []):
            if 'establishment' not in geocode_result[0].get('types', []):
                fraud_indicators.append("Appears to be residential address")
        
        # Check if parking lot
        if 'parking' in place_types:
            fraud_indicators.append("Address is a parking lot")
        
        return {
            "is_medical_facility": is_medical,
            "facility_type": facility_type,
            "place_types": place_types,
            "formatted_address": formatted_address,
            "coordinates": {
                "lat": location['lat'],
                "lng": location['lng']
            },
            "fraud_indicators": fraud_indicators,
            "confidence": 1.0 if is_medical else 0.3,
            "check_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"  ⚠️ Geo-verification failed: {e}")
        return {
            "is_medical_facility": None,
            "error": str(e)
        }


# ============================================
# 5. ENHANCED WEB SEARCH (SERPER API)
# ============================================

def search_provider_web_presence(provider_name: str, npi: str, phone: str = None) -> dict:
    """
    Search for provider's digital footprint using Serper API
    
    Checks:
    - Google Business Profile
    - Recent mentions
    - Website presence
    """
    from dotenv import load_dotenv
    load_dotenv()
    
    api_key = os.getenv("SERPER_API_KEY")
    
    if not api_key:
        return {"error": "SERPER_API_KEY not found"}
    
    search_query = f'"{provider_name}" NPI {npi}'
    if phone:
        search_query += f' "{phone}"'
    
    print(f"  🔍 Searching web presence: {search_query}")
    
    try:
        url = "https://google.serper.dev/search"
        
        payload = {
            "q": search_query,
            "num": 10
        }
        
        headers = {
            'X-API-KEY': api_key,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        data = response.json()
        
        # Extract knowledge graph (Google Business Profile)
        knowledge_graph = data.get('knowledgeGraph', {})
        
        # Count recent results (last 6 months)
        organic_results = data.get('organic', [])
        
        web_presence_score = 0.0
        
        if knowledge_graph:
            web_presence_score += 0.5
            print(f"  ✅ Found Google Knowledge Graph")
        
        if len(organic_results) >= 5:
            web_presence_score += 0.3
            print(f"  ✅ Found {len(organic_results)} search results")
        elif len(organic_results) >= 2:
            web_presence_score += 0.15
        
        return {
            "web_presence_score": web_presence_score,
            "knowledge_graph": knowledge_graph,
            "result_count": len(organic_results),
            "top_results": organic_results[:5],
            "search_date": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"  ⚠️ Web presence search failed: {e}")
        return {"error": str(e), "web_presence_score": 0.0}


# ============================================
# USAGE EXAMPLES
# ============================================

if __name__ == "__main__":
    print("="*60)
    print("PRODUCTION TOOLS - USAGE EXAMPLES")
    print("="*60)
    
    # Example 1: OIG Check
    print("\n1. OIG LEIE Exclusion Check:")
    oig_result = check_oig_leie_exclusion(
        npi="1234567890",
        first_name="John",
        last_name="Smith"
    )
    print(f"   Result: {oig_result}")
    
    # Example 2: State License (California)
    print("\n2. State License Verification:")
    license_result = verify_state_license_universal(
        state_code="CA",
        license_number="A12345",
        provider_name="Dr. Jane Doe"
    )
    print(f"   Result: {license_result}")
    
    # Example 3: Google Scholar
    print("\n3. Google Scholar Search:")
    scholar_result = search_google_scholar(
        provider_name="Dr. Robert Johnson",
        year_min=2024
    )
    print(f"   Publications found: {scholar_result.get('publication_count', 0)}")
    
    # Example 4: Geo-Verification
    print("\n4. Geo-Verification:")
    geo_result = verify_medical_facility(
        address="1234 Medical Center Dr",
        city="Los Angeles",
        state="CA",
        zip_code="90001"
    )
    print(f"   Is medical facility: {geo_result.get('is_medical_facility')}")
    
    # Example 5: Web Presence
    print("\n5. Web Presence Check:")
    web_result = search_provider_web_presence(
        provider_name="Dr. Sarah Williams",
        npi="9876543210",
        phone="555-1234"
    )
    print(f"   Web presence score: {web_result.get('web_presence_score', 0):.2f}")