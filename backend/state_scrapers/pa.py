"""
Pennsylvania State Board of Medicine License Verification Scraper
File: backend/state_scrapers/pa.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime


def verify_pennsylvania_medical_board(license_number: str, last_name: str) -> dict:
    """
    Pennsylvania State Board of Medicine license verification
    URL: https://www.pals.pa.gov/
    """
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying PA license: {license_number}")
        
        # Navigate to PA License System
        driver.get("https://www.pals.pa.gov/#/page/search")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(3)
        
        # Click on "License Number" search option
        license_tab = wait.until(
            EC.element_to_be_clickable((By.XPATH, "//a[contains(text(), 'License Number')]"))
        )
        license_tab.click()
        time.sleep(1)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "licenseNumber"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Click search button
        search_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Search')]")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Click on first result
            first_result = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//table//tbody//tr[1]//a"))
            )
            first_result.click()
            time.sleep(2)
            
            # Get provider name
            name_element = wait.until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'detail-name')]"))
            )
            provider_name = name_element.text.strip()
            
            # Get license information
            try:
                status_element = driver.find_element(By.XPATH, "//th[contains(text(), 'Status')]/following-sibling::td")
                status = status_element.text.strip()
            except NoSuchElementException:
                status = "Unknown"
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.XPATH, "//th[contains(text(), 'Expiration Date')]/following-sibling::td")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get issue date
            try:
                issue_element = driver.find_element(By.XPATH, "//th[contains(text(), 'Issue Date')]/following-sibling::td")
                issue_date = issue_element.text.strip()
            except NoSuchElementException:
                issue_date = "Not Available"
            
            # Get board name
            try:
                board_element = driver.find_element(By.XPATH, "//th[contains(text(), 'Board')]/following-sibling::td")
                board = board_element.text.strip()
            except NoSuchElementException:
                board = "Not Available"
            
            # Check for disciplinary actions
            try:
                discipline_section = driver.find_element(By.XPATH, "//h3[contains(text(), 'Disciplinary Actions')]")
                # Check if there's content under disciplinary actions
                has_discipline = len(driver.find_elements(By.XPATH, "//h3[contains(text(), 'Disciplinary Actions')]/following-sibling::div//table//tr")) > 0
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "PA",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "board": board,
                "expiration_date": expiration_date,
                "issue_date": issue_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "Pennsylvania License System",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "VALID"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "PA",
                "license_number": license_number,
                "error": "License not found",
                "source": "Pennsylvania License System",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "PA",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "Pennsylvania License System",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()