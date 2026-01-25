"""
Production-Ready Tools for Healthcare Provider Verification
============================================================

Installation Requirements:
pip install requests beautifulsoup4 selenium googlemaps serper-python python-dotenv pandas

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

# Import state scrapers
from state_scrapers import get_scraper, is_state_supported, SUPPORTED_STATES

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

def verify_state_license_universal(state_code: str, license_number: str, 
                                   provider_name: str) -> dict:
    """
    Universal state license checker with automated state-specific scrapers.
    
    Args:
        state_code: Two-letter state code (e.g., 'CA', 'TX', 'FL')
        license_number: Provider's license number
        provider_name: Full name of the provider (last name will be extracted)
        
    Returns:
        Dictionary containing verification results:
        - verified: bool - Whether license was successfully verified
        - state: str - State code
        - license_number: str - License number checked
        - provider_name: str - Name found on license (if verified)
        - status: str - License status (Active, Expired, etc.)
        - expiration_date: str - License expiration date
        - name_match: bool - Whether provider name matches
        - has_disciplinary_actions: bool - Whether there are disciplinary actions
        - source: str - Verification source
        - verification_date: str - When verification was performed
        - active: bool - Whether license is currently active
        - error: str - Error message (if verification failed)
    """
    
    print(f"\n🔍 Verifying {state_code} license: {license_number}")
    
    # Check if state is supported
    if not is_state_supported(state_code):
        print(f"  ⚠️ No automated scraper for state: {state_code}")
        print(f"  📋 Supported states: {', '.join(SUPPORTED_STATES)}")
        return {
            "verified": False,
            "state": state_code,
            "license_number": license_number,
            "status": "Manual Verification Required",
            "note": f"State {state_code} requires manual verification",
            "supported_states": SUPPORTED_STATES
        }
    
    # Get the appropriate scraper
    scraper_func = get_scraper(state_code)
    
    # Extract last name from provider name
    last_name = provider_name.split()[-1] if provider_name else ""
    
    try:
        # Run the state-specific scraper
        result = scraper_func(license_number, last_name)
        
        # Add provider verification summary
        if result.get("verified"):
            if result.get("active"):
                print(f"  ✅ License ACTIVE - {result.get('provider_name')}")
            else:
                print(f"  ⚠️ License status: {result.get('status')}")
            
            if result.get("name_match"):
                print(f"  ✅ Name matches: {last_name}")
            else:
                print(f"  ⚠️ Name mismatch - Expected: {last_name}, Found: {result.get('provider_name')}")
            
            if result.get("has_disciplinary_actions"):
                print(f"  ⚠️ Disciplinary actions found")
        else:
            print(f"  ❌ Verification failed: {result.get('error')}")
        
        return result
        
    except Exception as e:
        print(f"  ❌ Error during verification: {str(e)}")
        return {
            "verified": False,
            "state": state_code,
            "license_number": license_number,
            "error": f"Unexpected error: {str(e)}",
            "source": f"{state_code} Medical Board"
        }


def batch_verify_licenses(license_data: list) -> list:
    """
    Verify multiple licenses in batch.
    
    Args:
        license_data: List of dicts with keys: state_code, license_number, provider_name
        
    Returns:
        List of verification results
    """
    results = []
    
    print(f"\n{'='*60}")
    print(f"📋 BATCH LICENSE VERIFICATION")
    print(f"{'='*60}")
    print(f"Total licenses to verify: {len(license_data)}")
    
    for idx, license_info in enumerate(license_data, 1):
        print(f"\n[{idx}/{len(license_data)}] Processing...")
        
        result = verify_state_license_universal(
            state_code=license_info.get('state_code'),
            license_number=license_info.get('license_number'),
            provider_name=license_info.get('provider_name')
        )
        
        results.append(result)
    
    # Summary
    verified_count = sum(1 for r in results if r.get('verified'))
    active_count = sum(1 for r in results if r.get('active'))
    
    print(f"\n{'='*60}")
    print(f"📊 VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"Total processed: {len(results)}")
    print(f"Successfully verified: {verified_count}")
    print(f"Active licenses: {active_count}")
    print(f"Failed/Manual: {len(results) - verified_count}")
    
    return results


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
# COMPREHENSIVE PROVIDER VERIFICATION
# ============================================

def comprehensive_provider_verification(provider_data: dict) -> dict:
    """
    Run all verification checks on a provider
    
    Args:
        provider_data: {
            'npi': str,
            'first_name': str,
            'last_name': str,
            'state_code': str,
            'license_number': str,
            'address': str,
            'city': str,
            'state': str,
            'zip_code': str,
            'phone': str (optional)
        }
    
    Returns:
        Comprehensive verification report
    """
    print(f"\n{'='*60}")
    print(f"🏥 COMPREHENSIVE PROVIDER VERIFICATION")
    print(f"{'='*60}")
    print(f"Provider: {provider_data.get('first_name')} {provider_data.get('last_name')}")
    print(f"NPI: {provider_data.get('npi')}")
    print(f"{'='*60}\n")
    
    report = {
        "provider_info": provider_data,
        "verification_date": datetime.now().isoformat(),
        "checks": {}
    }
    
    # 1. OIG Exclusion Check
    print("1️⃣ Running OIG Exclusion Check...")
    report['checks']['oig_exclusion'] = check_oig_leie_csv_method(
        npi=provider_data.get('npi'),
        first_name=provider_data.get('first_name'),
        last_name=provider_data.get('last_name')
    )
    
    # 2. State License Verification
    print("\n2️⃣ Running State License Verification...")
    report['checks']['state_license'] = verify_state_license_universal(
        state_code=provider_data.get('state_code'),
        license_number=provider_data.get('license_number'),
        provider_name=f"{provider_data.get('first_name')} {provider_data.get('last_name')}"
    )
    
    # 3. Geo-Verification
    print("\n3️⃣ Running Geo-Verification...")
    report['checks']['geo_verification'] = verify_medical_facility(
        address=provider_data.get('address'),
        city=provider_data.get('city'),
        state=provider_data.get('state'),
        zip_code=provider_data.get('zip_code')
    )
    
    # 4. Web Presence Check
    print("\n4️⃣ Running Web Presence Check...")
    report['checks']['web_presence'] = search_provider_web_presence(
        provider_name=f"{provider_data.get('first_name')} {provider_data.get('last_name')}",
        npi=provider_data.get('npi'),
        phone=provider_data.get('phone')
    )
    
    # 5. Google Scholar Search
    print("\n5️⃣ Running Google Scholar Search...")
    report['checks']['publications'] = search_google_scholar(
        provider_name=f"{provider_data.get('first_name')} {provider_data.get('last_name')}",
        year_min=2020
    )
    
    # Calculate overall verification score
    score = 0.0
    max_score = 5.0
    
    # OIG (critical - must pass)
    if not report['checks']['oig_exclusion'].get('is_excluded'):
        score += 1.0
    else:
        score = 0  # Automatic failure
    
    # State License
    if report['checks']['state_license'].get('verified') and report['checks']['state_license'].get('active'):
        score += 1.5
    
    # Geo
    if report['checks']['geo_verification'].get('is_medical_facility'):
        score += 1.0
    
    # Web Presence
    score += report['checks']['web_presence'].get('web_presence_score', 0) * 1.0
    
    # Publications (bonus)
    if report['checks']['publications'].get('publication_count', 0) > 0:
        score += 0.5
    
    report['verification_score'] = round(score / max_score * 100, 2)
    report['verification_status'] = (
        "VERIFIED" if score >= 3.5 else
        "NEEDS REVIEW" if score >= 2.0 else
        "FAILED"
    )
    
    print(f"\n{'='*60}")
    print(f"📊 VERIFICATION SUMMARY")
    print(f"{'='*60}")
    print(f"Overall Score: {report['verification_score']}%")
    print(f"Status: {report['verification_status']}")
    print(f"{'='*60}\n")
    
    return report


# ============================================
# USAGE EXAMPLES
# ============================================

if __name__ == "__main__":
    print("="*60)
    print("PRODUCTION TOOLS - USAGE EXAMPLES")
    print("="*60)
    
    # Example: Comprehensive Verification
    provider_data = {
        'npi': '1234567890',
        'first_name': 'John',
        'last_name': 'Smith',
        'state_code': 'CA',
        'license_number': 'A12345',
        'address': '1234 Medical Center Dr',
        'city': 'Los Angeles',
        'state': 'CA',
        'zip_code': '90001',
        'phone': '555-1234'
    }
    
    verification_report = comprehensive_provider_verification(provider_data)
    
    # Save report
    import json
    with open('verification_report.json', 'w') as f:
        json.dump(verification_report, f, indent=2)
    
    print("✅ Verification report saved to verification_report.json")