"""
North Carolina Medical Board License Verification Scraper
File: backend/state_scrapers/nc.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime


def verify_north_carolina_medical_board(license_number: str, last_name: str) -> dict:
    """
    North Carolina Medical Board license verification
    URL: https://www.ncmedboard.org/verification
    """
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying NC license: {license_number}")
        
        # Navigate to NC Medical Board verification
        driver.get("https://www.ncmedboard.org/verification")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(2)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "licenseNumber"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Enter last name
        name_input = driver.find_element(By.ID, "lastName")
        name_input.clear()
        name_input.send_keys(last_name)
        
        # Click search button
        search_button = driver.find_element(By.XPATH, "//button[@type='submit']")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Get provider name
            name_element = wait.until(
                EC.presence_of_element_located((By.XPATH, "//div[@class='verification-result']//h3"))
            )
            provider_name = name_element.text.strip()
            
            # Get license status
            status_element = driver.find_element(By.XPATH, "//strong[contains(text(), 'License Status')]/following-sibling::span")
            status = status_element.text.strip()
            
            # Get license type
            try:
                type_element = driver.find_element(By.XPATH, "//strong[contains(text(), 'License Type')]/following-sibling::span")
                license_type = type_element.text.strip()
            except NoSuchElementException:
                license_type = "Not Available"
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.XPATH, "//strong[contains(text(), 'Expires')]/following-sibling::span")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get issue date
            try:
                issue_element = driver.find_element(By.XPATH, "//strong[contains(text(), 'Issue Date')]/following-sibling::span")
                issue_date = issue_element.text.strip()
            except NoSuchElementException:
                issue_date = "Not Available"
            
            # Check for disciplinary actions
            try:
                discipline_section = driver.find_element(By.XPATH, "//div[contains(@class, 'disciplinary-actions')]")
                has_discipline = "no action" not in discipline_section.text.lower()
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "NC",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "license_type": license_type,
                "expiration_date": expiration_date,
                "issue_date": issue_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "North Carolina Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "GOOD STANDING"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "NC",
                "license_number": license_number,
                "error": "License not found",
                "source": "North Carolina Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "NC",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "North Carolina Medical Board",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()