"""
California Medical Board License Verification Scraper
File: backend/state_scrapers/ca.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime


def verify_california_medical_board(license_number: str, last_name: str) -> dict:
    """
    California Medical Board license verification
    URL: https://search.dca.ca.gov/
    """
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying CA license: {license_number}")
        
        # Navigate to CA Medical Board search
        driver.get("https://search.dca.ca.gov/")
        wait = WebDriverWait(driver, 15)
        
        # Wait for page load
        time.sleep(2)
        
        # Select "Medical Board of California" from dropdown
        board_dropdown = wait.until(
            EC.presence_of_element_located((By.ID, "boardCode"))
        )
        board_dropdown.send_keys("Medical Board of California")
        time.sleep(1)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "licenseNumber"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Click search button
        search_button = driver.find_element(By.XPATH, "//button[@type='submit' and contains(text(), 'Search')]")
        search_button.click()
        
        # Wait for results
        time.sleep(3)
        
        # Parse results
        try:
            # Check if license found
            name_element = wait.until(
                EC.presence_of_element_located((By.XPATH, "//td[contains(text(), 'Name')]/following-sibling::td"))
            )
            provider_name = name_element.text.strip()
            
            # Get license status
            status_element = driver.find_element(By.XPATH, "//td[contains(text(), 'License Status')]/following-sibling::td")
            status = status_element.text.strip()
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.XPATH, "//td[contains(text(), 'Expiration Date')]/following-sibling::td")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get issue date
            try:
                issue_element = driver.find_element(By.XPATH, "//td[contains(text(), 'Issue Date')]/following-sibling::td")
                issue_date = issue_element.text.strip()
            except NoSuchElementException:
                issue_date = "Not Available"
            
            # Check for disciplinary actions
            try:
                disciplinary = driver.find_element(By.XPATH, "//td[contains(text(), 'Disciplinary Actions')]")
                has_discipline = True
            except NoSuchElementException:
                has_discipline = False
            
            # Verify last name matches
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "CA",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "expiration_date": expiration_date,
                "issue_date": issue_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "California Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "RENEWED"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "CA",
                "license_number": license_number,
                "error": "License not found",
                "source": "California Medical Board",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "CA",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "California Medical Board",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()