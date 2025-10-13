import requests
from bs4 import BeautifulSoup
import random
from datetime import date, timedelta

def check_state_license(first_name: str, last_name: str, state: str) -> dict:
    """
    Checks a provider's license status against their state medical board.
    Currently features a real implementation for California (CA). Other states
    return an 'Unsupported' message.
    """
    
    # --- Real Implementation for California ---
    if state.upper() == "CA":
        print(f"\nREAL TOOL: Checking California Medical Board for {first_name} {last_name}...")
        try:
            search_url = "https://search.dca.ca.gov/results"
            payload = {
                'boardCode': '800', # Medical Board of California
                'licenseTypeCode': '17', # Physician and Surgeon's License
                'firstName': first_name,
                'lastName': last_name,
            }
            
            response = requests.post(search_url, data=payload, timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            results_list = soup.find('ul', id='results')
            if not results_list or not results_list.find('li'):
                return {
                    "status": "Not Found",
                    "message": "No license found for the given name in California.",
                    "source": "California Medical Board"
                }
            
            # Get the first result for simplicity
            first_result = results_list.find('li')
            license_details = {}
            
            name_tag = first_result.find('h3')
            if name_tag:
                license_details['name'] = name_tag.text.strip()

            details = first_result.find_all('p')
            for detail in details:
                label = detail.find('span', class_='label')
                value = detail.find('span', class_='value')
                if label and value:
                    key = label.text.strip().lower().replace(' ', '_').replace(':', '')
                    license_details[key] = value.text.strip()
            
            return {
                "status": license_details.get("primary_status", "Unknown"),
                "license_number": license_details.get("license_number", "Unknown"),
                "license_type": license_details.get("license_type", "Unknown"),
                "expiry_date": license_details.get("expiration_date", "Unknown"),
                "source": "California Medical Board (Live Scrape)"
            }

        except requests.exceptions.RequestException as e:
            return { "status": "Error", "message": f"Could not connect to CA Medical Board: {str(e)}", "source": "California Medical Board" }
        except Exception as e:
            return { "status": "Error", "message": f"Failed to parse CA license data: {str(e)}", "source": "California Medical Board" }

    # --- Fallback for all other states ---
    else:
        print(f"\nTOOL: State '{state}' not supported for live license check. Returning placeholder.")
        return {
            "status": "Unsupported State",
            "message": f"License verification for {state} is not yet implemented. Live support is enabled for CA.",
            "supported_states": ["CA"],
            "source": "State License Validator"
        }

