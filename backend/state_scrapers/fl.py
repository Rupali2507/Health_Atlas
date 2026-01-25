"""
Florida Board of Medicine License Verification Scraper
File: backend/state_scrapers/fl.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime

from config import USE_MOCK_STATE_SCRAPERS
from state_scrapers.mock_response import mock_license_response



def verify_florida_medical_board(license_number: str, last_name: str) -> dict:
    """
    Florida Board of Medicine license verification
    URL: https://mqa-internet.doh.state.fl.us/MQASearchServices/Home
    """
    if USE_MOCK_STATE_SCRAPERS:
        return mock_license_response(
            state_code="FL",  
            license_number=license_number,
            provider_name=last_name
        )

    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying FL license: {license_number}")
        
        # Navigate to Florida DOH search
        driver.get("https://mqa-internet.doh.state.fl.us/MQASearchServices/Home")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(2)
        
        # Click "Search by License Number"
        license_radio = wait.until(
            EC.element_to_be_clickable((By.ID, "RadioLicenseNumber"))
        )
        license_radio.click()
        time.sleep(1)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "LicenseNumber"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Click search button
        search_button = driver.find_element(By.ID, "btnSearch")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Click on the first result to view details
            first_result = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//table[@id='table']//tr[@class='grid-row']//a"))
            )
            first_result.click()
            time.sleep(2)
            
            # Get provider name
            name_element = wait.until(
                EC.presence_of_element_located((By.XPATH, "//span[@id='ContentPlaceHolder1_lblName']"))
            )
            provider_name = name_element.text.strip()
            
            # Get license status
            status_element = driver.find_element(By.XPATH, "//span[@id='ContentPlaceHolder1_lblStatus']")
            status = status_element.text.strip()
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.XPATH, "//span[@id='ContentPlaceHolder1_lblExpires']")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get original issue date
            try:
                issue_element = driver.find_element(By.XPATH, "//span[@id='ContentPlaceHolder1_lblOriginal']")
                issue_date = issue_element.text.strip()
            except NoSuchElementException:
                issue_date = "Not Available"
            
            # Get profession
            try:
                prof_element = driver.find_element(By.XPATH, "//span[@id='ContentPlaceHolder1_lblProfession']")
                profession = prof_element.text.strip()
            except NoSuchElementException:
                profession = "Not Available"
            
            # Check for disciplinary actions
            try:
                discipline_section = driver.find_element(By.XPATH, "//div[@id='ContentPlaceHolder1_pnlDiscipline']")
                has_discipline = "No disciplinary action" not in discipline_section.text
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "FL",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "profession": profession,
                "expiration_date": expiration_date,
                "issue_date": issue_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "Florida Board of Medicine",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "CLEAR"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "FL",
                "license_number": license_number,
                "error": "License not found",
                "source": "Florida Board of Medicine",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "FL",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "Florida Board of Medicine",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()