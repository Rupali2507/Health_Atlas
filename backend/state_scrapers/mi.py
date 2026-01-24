"""
Michigan Department of Licensing and Regulatory Affairs License Verification Scraper
File: backend/state_scrapers/mi.py
"""

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time
from datetime import datetime


def verify_michigan_medical_board(license_number: str, last_name: str) -> dict:
    """
    Michigan LARA license verification
    URL: https://aca-prod.accela.com/MILARA/
    """
    
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        print(f"  🔍 Verifying MI license: {license_number}")
        
        # Navigate to Michigan LARA
        driver.get("https://aca-prod.accela.com/MILARA/Cap/CapHome.aspx?module=Enforcement&TabName=Enforcement")
        wait = WebDriverWait(driver, 15)
        
        time.sleep(3)
        
        # Click on License Verification
        verification_link = wait.until(
            EC.element_to_be_clickable((By.LINK_TEXT, "License Verification"))
        )
        verification_link.click()
        time.sleep(2)
        
        # Select "Medicine" from profession
        profession_select = wait.until(
            EC.presence_of_element_located((By.ID, "ctl00_PlaceHolderMain_generalSearchForm_ddlGSPermitType"))
        )
        profession_select.send_keys("Medicine")
        time.sleep(1)
        
        # Enter license number
        license_input = wait.until(
            EC.presence_of_element_located((By.ID, "ctl00_PlaceHolderMain_generalSearchForm_txtGSLicenseNumber"))
        )
        license_input.clear()
        license_input.send_keys(license_number)
        
        # Click search
        search_button = driver.find_element(By.ID, "ctl00_PlaceHolderMain_btnNewSearch")
        search_button.click()
        time.sleep(3)
        
        # Parse results
        try:
            # Click on first result
            first_result = wait.until(
                EC.element_to_be_clickable((By.XPATH, "//table[@id='ctl00_PlaceHolderMain_dgvPermitList_gdvPermitList']//a"))
            )
            first_result.click()
            time.sleep(2)
            
            # Get provider name
            name_element = wait.until(
                EC.presence_of_element_located((By.ID, "ctl00_PlaceHolderMain_lblContactName"))
            )
            provider_name = name_element.text.strip()
            
            # Get license status
            status_element = driver.find_element(By.ID, "ctl00_PlaceHolderMain_lblPermitStatus")
            status = status_element.text.strip()
            
            # Get expiration date
            try:
                exp_element = driver.find_element(By.ID, "ctl00_PlaceHolderMain_lblExpirationDate")
                expiration_date = exp_element.text.strip()
            except NoSuchElementException:
                expiration_date = "Not Available"
            
            # Get issue date
            try:
                issue_element = driver.find_element(By.ID, "ctl00_PlaceHolderMain_lblIssueDate")
                issue_date = issue_element.text.strip()
            except NoSuchElementException:
                issue_date = "Not Available"
            
            # Get license type
            try:
                type_element = driver.find_element(By.ID, "ctl00_PlaceHolderMain_lblPermitType")
                license_type = type_element.text.strip()
            except NoSuchElementException:
                license_type = "Not Available"
            
            # Check for disciplinary actions
            try:
                discipline_tab = driver.find_element(By.LINK_TEXT, "Enforcement")
                discipline_tab.click()
                time.sleep(1)
                has_discipline = len(driver.find_elements(By.XPATH, "//table[@id='enforcement_table']//tr")) > 1
            except NoSuchElementException:
                has_discipline = False
            
            # Verify name match
            name_match = last_name.upper() in provider_name.upper()
            
            return {
                "verified": True,
                "state": "MI",
                "license_number": license_number,
                "provider_name": provider_name,
                "status": status,
                "license_type": license_type,
                "expiration_date": expiration_date,
                "issue_date": issue_date,
                "name_match": name_match,
                "has_disciplinary_actions": has_discipline,
                "source": "Michigan LARA",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "active": status.upper() in ["ACTIVE", "CURRENT", "ISSUED"]
            }
            
        except TimeoutException:
            return {
                "verified": False,
                "state": "MI",
                "license_number": license_number,
                "error": "License not found",
                "source": "Michigan LARA",
                "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
    
    except Exception as e:
        return {
            "verified": False,
            "state": "MI",
            "license_number": license_number,
            "error": f"Scraper error: {str(e)}",
            "source": "Michigan LARA",
            "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
    
    finally:
        driver.quit()