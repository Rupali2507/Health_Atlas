import os
import json
import subprocess
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from selenium import webdriver
from selenium.webdriver.edge.options import Options
from bs4 import BeautifulSoup
import time
import socket
import pgeocode
import requests

# --- Network Fix ---
def allowed_gai_family():
    return socket.AF_INET
requests.packages.urllib3.util.connection.allowed_gai_family = allowed_gai_family

# --- TOOL 1: NPI REGISTRY SEARCH ---
def search_npi_registry(first_name: str = "", last_name: str = "", npi_number: str = "", state: str = "") -> dict:
    print(f"\nTOOL: Searching NPI Registry for NPI: {npi_number}, Name: {first_name} {last_name}, State: {state}")
    base_url = "https://npiregistry.cms.hhs.gov/api/"
    params = {k: v for k, v in {"version": "2.1", "first_name": first_name.strip(), "last_name": last_name.strip(), "number": npi_number.strip(), "state": state.strip()}.items() if v}
    try:
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("result_count", 0) > 0:
            return data['results'][0]
        else:
            return {"error": "No results found."}
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}"}

# --- TOOL 2: PDF PARSER ---
def parse_provider_pdf(pdf_path: str) -> str:
    print(f"\nTOOL: Parsing PDF '{pdf_path}' using PyPDF2...")
    try:
        reader = PdfReader(pdf_path)
        extracted_text = ""
        for page in reader.pages:
            extracted_text += page.extract_text() + "\n"
        return extracted_text
    except Exception as e:
        return f"An unexpected error occurred while parsing the PDF: {e}"

# --- TOOL 3: DYNAMIC WEB SCRAPER ---
def scrape_provider_website(url: str) -> str:
    print(f"\nTOOL: Scraping website at URL: {url}")
    edge_options = Options(); edge_options.add_argument("--headless"); edge_options.add_argument("--no-sandbox")
    driver = None
    try:
        driver = webdriver.Edge(options=edge_options)
        driver.get(url); time.sleep(3)
        soup = BeautifulSoup(driver.page_source, "html.parser")
        return soup.get_text(separator=' ', strip=True)
    except Exception as e:
        return f"An error occurred while scraping the website: {e}"
    finally:
        if driver: driver.quit()

# --- TOOL 4: ADDRESS VALIDATION ---
def validate_address(address: str, city: str, state: str, zip_code: str) -> dict:
    print(f"\nTOOL: Validating address with Geoapify...")
    api_key = os.environ.get("GEOAPIFY_API_KEY")
    if not api_key: return {"error": "GEOAPIFY_API_KEY not set."}
    url = "https://api.geoapify.com/v1/geocode/search"
    params = {"text": f"{address}, {city}, {state} {zip_code}, USA", "apiKey": api_key}
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status(); data = response.json()
        if data.get("features"):
            first_result = data["features"][0]["properties"]
            confidence = first_result.get("rank", {}).get("confidence", 0)
            verdict = "Not Confident"
            if confidence >= 0.95: verdict = "High Confidence Match"
            elif confidence >= 0.7: verdict = "Medium Confidence Match"
            return {"verdict": verdict, "confidence_score": confidence, "found_address": first_result.get("formatted")}
        else:
            return {"verdict": "Address Not Found", "confidence_score": 0}
    except requests.exceptions.RequestException as e:
        return {"error": f"An error occurred calling Geoapify: {e}"}

# --- NEW TOOL 5: PHONE NUMBER VALIDATION ---
def validate_phone_number(phone_number: str, country_code: str = 'US') -> dict:
    """
    Performs a basic validation of a phone number's format.
    """
    print(f"\nTOOL: Validating phone number {phone_number}...")
    try:
        # A real implementation would use a paid API like Twilio.
        # For the hackathon, we'll do a simple format check.
        if phone_number and len(str(phone_number)) >= 10:
             return {"is_valid_format": True, "verdict": "Plausible format"}
        else:
             return {"is_valid_format": False, "verdict": "Invalid format"}
    except Exception as e:
        return {"error": f"An error occurred during phone validation: {e}"}

