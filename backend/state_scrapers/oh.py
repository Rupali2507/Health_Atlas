"""
Ohio State Medical Board License Verification Scraper
File: backend/state_scrapers/oh.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime


def verify_ohio_medical_board(license_number: str, last_name: str) -> dict:
    """
    Ohio State Medical Board license verification
    URL: https://elicense.ohio.gov/
    """
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying OH license: {license_number}")
        
        # Navigate to Ohio eLicense
        driver.get("https://elicense.ohio.gov/oh_verifylicense")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(2)
        
        # Select "State Medical Board" from board dropdown
        board_select = wait.until(
            EC.presence_of_element_located((By.ID, "BoardCode"))
        )
        board_select.send_keys("State Medical Board")
        time.sleep(1)
        
        # Click "License Number" radio button
        license_radio = driver.find_element(By.ID, "LicenseNumber")
        license_radio.click()
        time.sleep(1)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "LicenseNumberTextBox"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Click search button
        search_button = driver.find_element(By.ID, "btnSearch")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Get provider name
            name_element = wait.until(
                EC.presence_of_element_located((By.XPATH, "//tr[td[contains(text(), 'Name')]]/td[2]"))
            )
            provider_name = name_element.text.strip()
            
            # Get license status
            status_element = driver.find_element(By.XPATH, "//tr[td[contains(text(), 'License Status')]]/td[2]")
            status = status_element.text.strip()
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.XPATH, "//tr[td[contains(text(), 'Expiration Date')]]/td[2]")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get issue date
            try:
                issue_element = driver.find_element(By.XPATH, "//tr[td[contains(text(), 'Original Issue Date')]]/td[2]")
                issue_date = issue_element.text.strip()
            except NoSuchElementException:
                issue_date = "Not Available"
            
            # Get license type
            try:
                type_element = driver.find_element(By.XPATH, "//tr[td[contains(text(), 'License Type')]]/td[2]")
                license_type = type_element.text.strip()
            except NoSuchElementException:
                license_type = "Not Available"
            
            # Check for disciplinary actions
            try:
                discipline_element = driver.find_element(By.XPATH, "//text()[contains(., 'Board Action')]")
                has_discipline = True
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "OH",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "license_type": license_type,
                "expiration_date": expiration_date,
                "issue_date": issue_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "Ohio State Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "VALID"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "OH",
                "license_number": license_number,
                "error": "License not found",
                "source": "Ohio State Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "OH",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "Ohio State Medical Board",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()