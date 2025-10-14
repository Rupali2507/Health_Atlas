import requests
import json
import os
import subprocess
import google.generativeai as genai
from pdf2image import convert_from_path
from dotenv import load_dotenv
from PyPDF2 import PdfReader
from pdf2image import convert_from_path


from selenium import webdriver
from selenium.webdriver.edge.options import Options
from bs4 import BeautifulSoup
import time
import socket


def allowed_gai_family():
    return socket.AF_INET

requests.packages.urllib3.util.connection.allowed_gai_family = allowed_gai_family



# --- TOOL 1: NPI REGISTRY SEARCH ---
def search_npi_registry(first_name: str = "", last_name: str = "", npi_number: str = "", state: str = "") -> dict:
    """Searches the NPPES NPI Registry for a provider."""
    print(f"\nTOOL: Searching NPI Registry for NPI: {npi_number}, Name: {first_name} {last_name}")
    base_url = "https://npiregistry.cms.hhs.gov/api/"
    params = {k: v for k, v in {"version": "2.1", "first_name": first_name.strip(), "last_name": last_name.strip(), "number": npi_number.strip(), "state": state.strip()}.items() if v}
    try:
        response = requests.get(base_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data.get("result_count", 0) > 0:
            print("TOOL: Found match in NPI Registry.")
            return data['results'][0]
        else:
            print("TOOL: No match found in NPI Registry.")
            return {"error": "No results found."}
    except requests.exceptions.RequestException as e:
        return {"error": f"API request failed: {e}"}
    
def parse_provider_pdf(pdf_path: str) -> list[dict]:
    """
    Converts a PDF to images, sends them to the Gemini VLM, 
    and extracts structured provider data.
    """
    print(f"\nTOOL: Parsing PDF '{pdf_path}' using Google Gemini VLM...")
    
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return [{"error": "GOOGLE_API_KEY environment variable not set."}]
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-pro-vision-latest')

    try:
        # Convert PDF pages to a list of images that genai can use
        images = convert_from_path(pdf_path)
        
        # Prepare image parts for the API call
        image_parts = []
        for image in images:
            # The genai library can handle Pillow image objects directly
            image_parts.append(image)

        print(f"TOOL: Converted PDF into {len(image_parts)} image(s) for Gemini analysis.")

        prompt = """
        Analyze the following image(s) of a provider directory.
        Your task is to extract the information for EACH provider listed.
        Return the data as a JSON array, where each object represents one provider.
        
        The JSON object for each provider should have the following keys:
        - "full_name" (string)
        - "npi" (string, if available, otherwise use an empty string "")
        - "address" (string, just the street address)
        - "city" (string)
        - "state" (string, 2-letter abbreviation)
        - "zip_code" (string)

        Return ONLY the JSON array in a markdown code block. Do not include any other text.
        """
        
        # Create the content list for the API
        contents = [prompt] + image_parts
        
        print("TOOL: Sending request to Google Gemini...")
        response = model.generate_content(contents)
        response_text = response.text
        print("TOOL: Received response from Gemini.")
        
        # Gemini often wraps JSON in ```json ... ```, so we robustly extract it.
        json_str = response_text.strip().replace("```json", "").replace("```", "").strip()
        
        return json.loads(json_str)

    except Exception as e:
        print(f"An unexpected error occurred while parsing the PDF with Gemini: {e}")
        return [{"error": f"An unexpected error occurred: {e}"}]

# def parse_provider_pdf(pdf_path: str) -> str:
#     """Converts a PDF file into text using the PyPDF2 library."""
#     print(f"\nTOOL: Parsing PDF '{pdf_path}' using PyPDF2...")
#     if not os.path.exists(pdf_path):
#         return f"Error: PDF not found at '{pdf_path}'"
#     try:
#         reader = PdfReader(pdf_path)
#         extracted_text = ""
#         for page in reader.pages:
#             extracted_text += page.extract_text() + "\n"
#         print("TOOL: Successfully extracted text from PDF.")
#         return extracted_text
#     except Exception as e:
#         return f"An unexpected error occurred while parsing the PDF: {e}"
    

# def parse_provider_pdf(pdf_path: str) -> str:
#     """Uploads a PDF to the VLM parsing microservice and returns the text."""
#     print(f"\nTOOL: Sending PDF to VLM parsing service...")
    
#     # Get the service URL from the environment variable we just set
#     parser_url = os.environ.get("PDF_PARSER_URL")
#     if not parser_url:
#         return "Error: PDF_PARSER_URL environment variable not set."

#     try:
#         with open(pdf_path, "rb") as f:
#             # The 'files' dictionary tells requests how to send the file
#             files = {'file': (os.path.basename(pdf_path), f, 'application/pdf')}
            
#             # Make the API call to your new microservice
#             response = requests.post(f"{parser_url}/parse-pdf/", files=files, timeout=300)
            
#             response.raise_for_status()
#             data = response.json()

#             if "text" in data:
#                 print("TOOL: Successfully extracted text using VLM microservice.")
#                 return data["text"]
#             else:
#                 return f"Error from parsing service: {data.get('error', 'Unknown error')}"
#     except requests.exceptions.RequestException as e:
#         return f"Error calling PDF parsing service: {e}"

# --- TOOL 3: DYNAMIC WEB SCRAPER (Edge Version) ---
def scrape_provider_website(url: str) -> str:
    """Scrapes text from a website using a headless Microsoft Edge browser."""
    print(f"\nTOOL: Scraping website at URL: {url}")
    
    edge_options = Options()
    edge_options.add_argument("--headless")
    edge_options.add_argument("--no-sandbox")
    edge_options.add_argument("--disable-dev-shm-usage")
    
    driver = None
    try:
        driver = webdriver.Edge(options=edge_options)
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
        if driver:
            driver.quit()

# --- TOOL 4: ADDRESS VALIDATION SERVICE (Geoapify Version) ---
def validate_address(address: str, city: str, state: str, zip_code: str) -> dict:
    """Validates an address using the Geoapify Geocoding API."""
    full_address = f"{address}, {city}, {state} {zip_code}, USA"
    print(f"\nTOOL: Validating address with Geoapify: {full_address}")

    api_key = os.environ.get("GEOAPIFY_API_KEY")
    if not api_key:
        return {"error": "GEOAPIFY_API_KEY environment variable not set."}

    url = "https://api.geoapify.com/v1/geocode/search"
    params = {"text": full_address, "apiKey": api_key}

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get("features"):
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
            return result
        else:
            return {"verdict": "Address Not Found", "confidence_score": 0}
    except requests.exceptions.RequestException as e:
        return {"error": f"An error occurred calling the Geoapify API: {e}"}

# --- Test block ---
if __name__ == '__main__':
    load_dotenv()
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

    print("--- Running Test Case 1: Search by NPI ---")
    print(json.dumps(search_npi_registry(npi_number="1235256050"), indent=2))
    
    print("\n--- Running Test Case 2: Parse Provider PDF ---")
    pdf_file_path = os.path.join(SCRIPT_DIR, 'Sample_Data', 'provider_directory.pdf')
    pdf_text = parse_provider_pdf(pdf_path=pdf_file_path)
    print(f"\nTest Result (first 500 chars):\n{pdf_text[:500]}")
    
    print("\n--- Running Test Case 3: Scrape Provider Website ---")
    test_url = "https://my.clevelandclinic.org/staff/9953-robert-ackerman"
    scraped_text = scrape_provider_website(test_url)
    print(f"\nTest Result (first 500 chars):\n{scraped_text[:500]}")

    print("\n--- Running Test Case 4: Validate Address (Geoapify) ---")
    print("\n--- Sub-case 4a: Valid Address ---")
    validation_result_good = validate_address(
        address="1600 Amphitheatre Parkway", city="Mountain View", state="CA", zip_code="94043"
    )
    print(json.dumps(validation_result_good, indent=2))