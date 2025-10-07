import requests
import json
import os
import socket # Required for the network fix
from requests.packages.urllib3.util.connection import allowed_gai_family # Required for the fix
from PyPDF2 import PdfReader
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from bs4 import BeautifulSoup
import time

# --- START IPv4 FIX (Corrected Syntax) ---
# This block forces the 'requests' library to prefer IPv4, which can solve
# specific DNS resolution issues on some Linux network configurations.
def allowed_gai_family_ipv4_only():
    """Returns the constant for the IPv4 address family."""
    return socket.AF_INET

# This line "monkey-patches" the underlying network library used by requests.
allowed_gai_family = allowed_gai_family_ipv4_only
# --- END IPv4 FIX ---


# Get the absolute path of the directory where this script (tools.py) is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# --- TOOL 1: NPI REGISTRY SEARCH ---
def search_npi_registry(first_name: str = "", last_name: str = "", npi_number: str = "") -> dict:
    """
    Searches the NPPES NPI Registry for a provider.
    """
    print(f"\nTOOL: Searching NPI Registry for NPI: {npi_number}, Name: {first_name} {last_name}")
    base_url = "https://npiregistry.cms.hhs.gov/api/"
    params = { "version": "2.1", "first_name": first_name.strip(), "last_name": last_name.strip(), "number": npi_number.strip() }
    try:
        # We add a timeout to prevent the request from hanging indefinitely
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("result_count", 0) > 0:
            print("TOOL: Found match in NPI Registry.")
            return data['results'][0]
        else:
            print("TOOL: No match found in NPI Registry.")
            return {"error": "No results found for the given criteria."}
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed. Network issue detected. Details: {e}"}

# --- TOOL 2: PDF PARSER ---
def parse_provider_pdf(pdf_path: str) -> str:
    """
    Converts a PDF file into text using the PyPDF2 library.
    """
    print(f"\nTOOL: Parsing PDF '{pdf_path}' using PyPDF2...")
    if not os.path.exists(pdf_path):
        return f"Error: Input PDF not found at '{pdf_path}'"
    try:
        reader = PdfReader(pdf_path)
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() + "\n"
        print("TOOL: Successfully extracted text from PDF.")
        return extracted_text
    except Exception as e:
        return f"An unexpected error occurred while parsing the PDF: {e}"

# --- TOOL 3: DYNAMIC WEB SCRAPER ---
def scrape_provider_website(url: str) -> str:
    """
    Scrapes the text content from a provider's website using a headless browser.
    """
    print(f"\nTOOL: Scraping website at URL: {url}")
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    service = Service(executable_path="/usr/bin/chromedriver")
    try:
        driver = webdriver.Chrome(service=service, options=chrome_options)
        driver.get(url)
        time.sleep(3)
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, "html.parser")
        text_content = soup.get_text(separator=' ', strip=True)
        print("TOOL: Successfully scraped website.")
        return text_content
    except Exception as e:
        return f"An error occurred while scraping the website: {e}"
    finally:
        if 'driver' in locals():
            driver.quit()
# --- TOOL 4: ADDRESS VALIDATION SERVICE (Geoapify Version) ---
def validate_address(address: str, city: str, state: str, zip_code: str) -> dict:
    """
    Validates an address using the Geoapify Geocoding API. This serves as a
    strong proxy for address validation by checking if the address can be
    accurately located.

    :param address: The street address line.
    :param city: The city name.
    :param state: The 2-letter state abbreviation.
    :param zip_code: The postal code.
    :return: A dictionary with the validation verdict and confidence score.
    """
    full_address = f"{address}, {city}, {state} {zip_code}, USA"
    print(f"\nTOOL: Validating address with Geoapify: {full_address}")

    # --- IMPORTANT ---
    # Get your Geoapify API key from an environment variable
    api_key = os.environ.get("GEOAPIFY_API_KEY")
    if not api_key:
        error_msg = "ERROR: GEOAPIFY_API_KEY environment variable not set."
        print(f"TOOL: {error_msg}")
        return {"error": error_msg}

    # Construct the API request URL
    url = "https://api.geoapify.com/v1/geocode/search"
    params = {
        "text": full_address,
        "apiKey": api_key
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        # Check if the API found any potential matches
        if data.get("features"):
            # Use the first, most likely result
            first_result = data["features"][0]["properties"]
            confidence = first_result.get("rank", {}).get("confidence", 0)
            
            verdict = "Not Confident"
            if confidence >= 0.95:
                verdict = "High Confidence Match"
            elif confidence >= 0.7:
                verdict = "Medium Confidence Match"

            result = {
                "verdict": verdict,
                "confidence_score": confidence,
                "found_address": first_result.get("formatted")
            }
            print("TOOL: Successfully received validation result from Geoapify.")
            return result
        else:
            print("TOOL: Address not found by Geoapify.")
            return {"verdict": "Address Not Found", "confidence_score": 0}

    except requests.exceptions.RequestException as e:
        error_message = f"An error occurred calling the Geoapify API: {e}"
        print(f"TOOL: {error_message}")
        return {"error": error_message}
# --- Test block ---
if __name__ == '__main__':
    print("\n--- Running Test Case 1: Search by NPI ---")
    print(json.dumps(search_npi_registry(npi_number="1235256050"), indent=2))
    print("\n" + "="*50 + "\n")

    print("--- Running Test Case 2: Search by Name ---")
    print(json.dumps(search_npi_registry(first_name="John", last_name="Smith"), indent=2))
    print("\n" + "="*50 + "\n")
    
    print("--- Running Test Case 3: Parse Provider PDF ---")
    pdf_file_path = os.path.join(SCRIPT_DIR, "provider_directory.pdf")
    pdf_text = parse_provider_pdf(pdf_path=pdf_file_path)
    print("\nTest Result (first 500 chars of extracted text):")
    print(pdf_text[:500])
    
    print("\n" + "="*50 + "\n")

    print("--- Running Test Case 4: Scrape Provider Website ---")
    test_url = "https://www.healthgrades.com/physician/dr-robert-ackerman-y428c"
    scraped_text = scrape_provider_website(test_url)
    print("\nTest Result (first 500 chars of scraped text):")
    print(scraped_text[:500])
    # Test Case 5: Validate an address using Geoapify
    print("--- Running Test Case 5: Validate Address (Geoapify) ---")
    
    print("\n--- Sub-case 5a: Valid Address ---")
    validation_result_good = validate_address(
        address="1600 Amphitheatre Parkway",
        city="Mountain View",
        state="CA",
        zip_code="94043"
    )
    print(json.dumps(validation_result_good, indent=2))

    print("\n--- Sub-case 5b: Fake Address ---")
    validation_result_bad = validate_address(
        address="123 Fake Street",
        city="Nowhere",
        state="CA",
        zip_code="90210" 
    )
    print(json.dumps(validation_result_bad, indent=2))
