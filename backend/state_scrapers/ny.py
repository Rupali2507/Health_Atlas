"""
New York State Education Department License Verification Scraper
File: backend/state_scrapers/ny.py
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



def verify_new_york_medical_board(license_number: str, last_name: str) -> dict:
    """
    New York State Education Department license verification
    URL: http://www.nysed.gov/coms
    """
    if USE_MOCK_STATE_SCRAPERS:
        return mock_license_response(
            state_code="NY",  
            license_number=license_number,
            provider_name=last_name
        )
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying NY license: {license_number}")
        
        # Navigate to NY Education Dept search
        driver.get("http://www.op.nysed.gov/verification-search")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(2)
        
        # Select "Medicine" from profession dropdown
        profession_select = wait.until(
            EC.presence_of_element_located((By.ID, "profcd"))
        )
        profession_select.send_keys("Medicine")
        time.sleep(1)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "licno"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Enter last name
        name_input = driver.find_element(By.ID, "lname")
        name_input.clear()
        name_input.send_keys(last_name)
        
        # Click search button
        search_button = driver.find_element(By.XPATH, "//input[@type='submit' and @value='Search']")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Check if results found
            results_table = wait.until(
                EC.presence_of_element_located((By.XPATH, "//table[@class='verificationResults']"))
            )
            
            # Get provider name
            name_cell = results_table.find_element(By.XPATH, ".//tr[td[contains(text(), 'Name')]]/td[2]")
            provider_name = name_cell.text.strip()
            
            # Get license status
            try:
                status_cell = results_table.find_element(By.XPATH, ".//tr[td[contains(text(), 'Status')]]/td[2]")
                status = status_cell.text.strip()
            except NoSuchElementException:
                status = "Unknown"
            
            # Get registration date
            try:
                reg_cell = results_table.find_element(By.XPATH, ".//tr[td[contains(text(), 'Registration Date')]]/td[2]")
                registration_date = reg_cell.text.strip()
            except NoSuchElementException:
                registration_date = "Not Available"
            
            # Get address (optional)
            try:
                addr_cell = results_table.find_element(By.XPATH, ".//tr[td[contains(text(), 'Address')]]/td[2]")
                address = addr_cell.text.strip()
            except NoSuchElementException:
                address = "Not Available"
            
            # Check for disciplinary actions
            try:
                discipline_text = driver.find_element(By.XPATH, "//text()[contains(., 'disciplinary')]").text
                has_discipline = "no disciplinary" not in discipline_text.lower()
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "NY",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "registration_date": registration_date,
                "address": address,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "New York State Education Department",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["REGISTERED", "ACTIVE", "CURRENT"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "NY",
                "license_number": license_number,
                "error": "License not found or no results",
                "source": "New York State Education Department",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "NY",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "New York State Education Department",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()