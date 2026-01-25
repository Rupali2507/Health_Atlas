"""
Texas Medical Board License Verification Scraper
File: backend/state_scrapers/tx.py
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



def verify_texas_medical_board(license_number: str, last_name: str) -> dict:
    """
    Texas Medical Board license verification
    URL: https://public.tmb.state.tx.us/
    """
    if USE_MOCK_STATE_SCRAPERS:
        return mock_license_response(
            state_code="TX",  
            license_number=license_number,
            provider_name=last_name
        )

    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying TX license: {license_number}")
        
        # Navigate to TX Medical Board search
        driver.get("https://public.tmb.state.tx.us/")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(2)
        
        # Click on "Physician Lookup"
        physician_link = wait.until(
            EC.element_to_be_clickable((By.LINK_TEXT, "Physician Lookup"))
        )
        physician_link.click()
        time.sleep(2)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "t_web_lookup__license_no"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Click search
        search_button = driver.find_element(By.NAME, "sch_button")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Get physician name
            name_element = wait.until(
                EC.presence_of_element_located((By.XPATH, "//td[@class='ForumPostBodyLabel' and contains(text(), 'Name')]/following-sibling::td"))
            )
            provider_name = name_element.text.strip()
            
            # Get license status
            status_element = driver.find_element(By.XPATH, "//td[@class='ForumPostBodyLabel' and contains(text(), 'License Status')]/following-sibling::td")
            status = status_element.text.strip()
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.XPATH, "//td[@class='ForumPostBodyLabel' and contains(text(), 'Expires')]/following-sibling::td")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get license type
            try:
                type_element = driver.find_element(By.XPATH, "//td[@class='ForumPostBodyLabel' and contains(text(), 'License Type')]/following-sibling::td")
                license_type = type_element.text.strip()
            except NoSuchElementException:
                license_type = "Not Available"
            
            # Check for board actions
            try:
                actions_link = driver.find_element(By.LINK_TEXT, "Board Actions")
                has_discipline = True
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "TX",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "license_type": license_type,
                "expiration_date": expiration_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "Texas Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "RENEWED", "VALID"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "TX",
                "license_number": license_number,
                "error": "License not found",
                "source": "Texas Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "TX",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "Texas Medical Board",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()