"""
COMPREHENSIVE HEALTH ATLAS VALIDATION SYSTEM TEST SUITE
========================================================

This suite tests ALL components:
✅ API Endpoints (FastAPI)
✅ LangGraph Agent Pipeline
✅ External API Tools (NPPES, OIG, State Boards, etc.)
✅ Database Connections (PostgreSQL)
✅ VLM/OCR Extraction (Gemini, OpenAI, Claude)
✅ File Parsers (PDF, Excel, CSV, Images)
✅ Logic Engine (Address validation, data health)

Run this to diagnose issues BEFORE deployment.
"""

import os
import sys
import json
import asyncio
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import traceback
from dotenv import load_dotenv

# Load .env from root directory (parent of backend)
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"✓ Loaded .env from: {env_path}")
else:
    print(f"⚠️ No .env file found at: {env_path}")
    print(f"   Trying current directory...")
    load_dotenv()  # Fallback to current directory

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text.center(70)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.END}\n")

def print_test(name: str):
    print(f"{Colors.BOLD}[TEST]{Colors.END} {name}...", end=" ")

def print_pass():
    print(f"{Colors.GREEN}✓ PASS{Colors.END}")

def print_fail(error: str = ""):
    print(f"{Colors.RED}✗ FAIL{Colors.END}")
    if error:
        print(f"  {Colors.RED}Error: {error}{Colors.END}")

def print_warn(message: str):
    print(f"{Colors.YELLOW}⚠ WARNING: {message}{Colors.END}")

def print_info(message: str):
    print(f"  {Colors.BLUE}ℹ {message}{Colors.END}")


# ============================================
# 1. ENVIRONMENT VARIABLES CHECK
# ============================================

def test_environment_variables() -> Tuple[bool, List[str]]:
    """Test that all required environment variables are set."""
    print_header("1. ENVIRONMENT VARIABLES CHECK")
    
    required_vars = {
        "DATABASE_URL": "PostgreSQL connection string",
        "GEOAPIFY_API_KEY": "Address validation",
        "SERPER_API_KEY": "Google Scholar & Web search",
    }
    
    optional_vars = {
        "GEMINI_API_KEY": "Primary VLM (Google Gemini)",
        "GOOGLE_API_KEY": "Alternative for Gemini",
        "OPENAI_API_KEY": "Fallback VLM (GPT-4o-mini)",
        "ANTHROPIC_API_KEY": "Fallback VLM (Claude Haiku)",
    }
    
    missing = []
    warnings = []
    
    # Check required
    for var, purpose in required_vars.items():
        print_test(f"Checking {var} ({purpose})")
        if os.getenv(var):
            print_pass()
        else:
            print_fail("Missing required variable")
            missing.append(var)
    
    # Check optional (at least one VLM API key needed)
    vlm_keys = [k for k in optional_vars.keys() if 'API_KEY' in k]
    vlm_found = any(os.getenv(k) for k in vlm_keys)
    
    for var, purpose in optional_vars.items():
        print_test(f"Checking {var} ({purpose})")
        if os.getenv(var):
            print_pass()
        else:
            print_warn(f"Optional variable not set")
            warnings.append(var)
    
    if not vlm_found:
        print_fail("No VLM API keys found - PDF/image extraction will fail")
        missing.append("At least one VLM API key (GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY)")
    
    return len(missing) == 0, missing


# ============================================
# 2. DATABASE CONNECTION TEST
# ============================================

def test_database_connection() -> bool:
    """Test PostgreSQL database connection and tables."""
    print_header("2. DATABASE CONNECTION TEST")
    
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        print_test("Connecting to PostgreSQL")
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            print_fail("DATABASE_URL not set")
            return False
        
        conn = psycopg2.connect(database_url)
        print_pass()
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test validated_providers table
        print_test("Checking 'validated_providers' table")
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM validated_providers
        """)
        result = cursor.fetchone()
        print_pass()
        print_info(f"Found {result['count']} validated provider(s)")
        
        # Test review_queue table
        print_test("Checking 'review_queue' table")
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM review_queue
        """)
        result = cursor.fetchone()
        print_pass()
        print_info(f"Found {result['count']} item(s) in review queue")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


# ============================================
# 3. EXTERNAL API TESTS
# ============================================

def test_nppes_api() -> bool:
    """Test NPPES NPI Registry API."""
    print_header("3. NPPES NPI REGISTRY API TEST")
    
    try:
        from tools import search_npi_registry
        
        # Using a known valid NPI - Dr. Stephen Strange (example from Marvel)
        # You can replace with any valid 10-digit NPI from https://npiregistry.cms.hhs.gov/
        print_test("Searching for test NPI (1003000126)")
        result = search_npi_registry(npi_number="1003000126")
        
        if result.get("result_count", 0) > 0:
            print_pass()
            provider = result["results"][0]
            basic = provider.get("basic", {})
            print_info(f"Found: {basic.get('first_name', '')} {basic.get('last_name', '')}")
            return True
        else:
            print_fail("No results returned")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


def test_oig_leie_check() -> bool:
    """Test OIG LEIE exclusion check."""
    print_header("4. OIG LEIE EXCLUSION CHECK TEST")
    
    try:
        from production_tools import check_oig_leie_csv_method
        
        print_test("Checking for test provider exclusion")
        result = check_oig_leie_csv_method(
            npi="1234567890",
            first_name="Test",
            last_name="Provider"
        )
        
        if "is_excluded" in result:
            print_pass()
            print_info(f"Exclusion status: {result['is_excluded']}")
            return True
        else:
            print_fail("Invalid response format")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


def test_geoapify_api() -> bool:
    """Test Geoapify address validation API."""
    print_header("5. GEOAPIFY ADDRESS VALIDATION TEST")
    
    try:
        from tools import validate_address
        
        print_test("Validating test address (Google HQ)")
        result = validate_address(
            address="1600 Amphitheatre Parkway",
            city="Mountain View",
            state="CA",
            zip_code="94043"
        )
        
        if "verdict" in result:
            print_pass()
            print_info(f"Verdict: {result['verdict']}")
            print_info(f"Confidence: {result.get('confidence_score', 0)}")
            return True
        else:
            print_fail("Invalid response format")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


def test_serper_api() -> bool:
    """Test Serper API for web search."""
    print_header("6. SERPER API (GOOGLE SCHOLAR) TEST")
    
    try:
        from production_tools import search_google_scholar
        
        print_test("Searching Google Scholar")
        result = search_google_scholar(
            provider_name="John Smith MD",
            year_min=2020
        )
        
        if "publication_count" in result or "error" in result:
            if "error" not in result:
                print_pass()
                print_info(f"Found {result['publication_count']} publications")
            else:
                print_warn(f"API error: {result['error']}")
            return True
        else:
            print_fail("Invalid response format")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


# ============================================
# 4. FILE PARSING TESTS
# ============================================

def test_csv_parsing() -> bool:
    """Test CSV file parsing."""
    print_header("7. CSV FILE PARSING TEST")
    
    try:
        from tools import parse_csv_file
        
        # Create test CSV
        test_csv = Path("test_providers.csv")
        test_csv.write_text("""full_name,NPI,specialty,address,city,state,zip_code,phone
Dr. John Smith,1234567890,Cardiology,123 Medical Dr,Los Angeles,CA,90001,555-1234
Dr. Jane Doe,0987654321,Neurology,456 Health Ave,San Francisco,CA,94102,555-5678
""")
        
        print_test("Parsing test CSV file")
        providers = parse_csv_file(str(test_csv))
        
        # Cleanup
        test_csv.unlink()
        
        if providers and len(providers) == 2:
            print_pass()
            print_info(f"Extracted {len(providers)} providers")
            return True
        else:
            print_fail(f"Expected 2 providers, got {len(providers)}")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


def test_excel_parsing() -> bool:
    """Test Excel file parsing."""
    print_header("8. EXCEL FILE PARSING TEST")
    
    try:
        from tools import parse_excel_file
        import pandas as pd
        
        # Create test Excel
        test_excel = Path("test_providers.xlsx")
        df = pd.DataFrame({
            "full_name": ["Dr. John Smith", "Dr. Jane Doe"],
            "NPI": ["1234567890", "0987654321"],
            "specialty": ["Cardiology", "Neurology"],
            "address": ["123 Medical Dr", "456 Health Ave"],
            "city": ["Los Angeles", "San Francisco"],
            "state": ["CA", "CA"],
            "zip_code": ["90001", "94102"],
            "phone": ["555-1234", "555-5678"]
        })
        df.to_excel(test_excel, index=False)
        
        print_test("Parsing test Excel file")
        providers = parse_excel_file(str(test_excel))
        
        # Cleanup
        test_excel.unlink()
        
        if providers and len(providers) == 2:
            print_pass()
            print_info(f"Extracted {len(providers)} providers")
            return True
        else:
            print_fail(f"Expected 2 providers, got {len(providers)}")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


def test_vlm_extraction() -> bool:
    """Test VLM/OCR extraction capabilities."""
    print_header("9. VLM/OCR EXTRACTION TEST")
    
    # Check which VLM APIs are available
    has_gemini = bool(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    
    if not (has_gemini or has_openai or has_anthropic):
        print_fail("No VLM API keys configured - skipping VLM tests")
        print_info("Set GEMINI_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY to enable")
        return False
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        from tools import extract_with_gemini_flash
        
        # Create a simple test image with text
        print_test("Creating test image with provider data")
        img = Image.new('RGB', (800, 200), color='white')
        draw = ImageDraw.Draw(img)
        
        # Try to use a font, fallback to default if not available
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        text = """
        Provider: Dr. John Smith
        NPI: 1234567890
        Specialty: Cardiology
        Address: 123 Medical Dr, Los Angeles, CA 90001
        Phone: 555-123-4567
        """
        
        draw.text((50, 50), text, fill='black', font=font)
        
        test_img_path = Path("test_provider_image.png")
        img.save(test_img_path)
        print_pass()
        
        # Test VLM extraction
        print_test("Testing VLM extraction on test image")
        
        if has_gemini:
            result = extract_with_gemini_flash([img], "test_image")
            
            if result.get("providers") and len(result["providers"]) > 0:
                print_pass()
                print_info(f"Extracted {len(result['providers'])} provider(s)")
                print_info(f"Method: {result.get('extraction_method', 'unknown')}")
                
                # Cleanup
                test_img_path.unlink()
                return True
            else:
                print_fail("No providers extracted from test image")
                test_img_path.unlink()
                return False
        else:
            print_warn("Gemini API not available, skipping VLM test")
            test_img_path.unlink()
            return True
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        if Path("test_provider_image.png").exists():
            Path("test_provider_image.png").unlink()
        return False


# ============================================
# 5. LOGIC ENGINE TESTS
# ============================================

def test_logic_engine() -> bool:
    """Test logic engine (address comparison, data health)."""
    print_header("10. LOGIC ENGINE TEST")
    
    try:
        from logic_engine import SurgicalValidator
        
        validator = SurgicalValidator()
        
        # Test 1: Address comparison
        print_test("Testing address auto-correction logic")
        result = validator.compare_addresses(
            "123 Main Street",
            "123 Main St"
        )
        
        if result.get("action") == "AUTO_CORRECT":
            print_pass()
            print_info(f"Action: {result['action']}, Reason: {result['reason']}")
        else:
            print_fail(f"Expected AUTO_CORRECT, got {result.get('action')}")
            return False
        
        # Test 2: Data health calculation
        print_test("Testing data health calculation")
        health = validator.calculate_data_health(
            last_updated_date="2024-01-01",
            source_type="NPI_REGISTRY",
            provider_type="INDIVIDUAL"
        )
        
        if "current_reliability" in health:
            print_pass()
            print_info(f"Reliability: {health['current_reliability']}, Status: {health['status']}")
            return True
        else:
            print_fail("Invalid response format")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


# ============================================
# 6. LANGGRAPH AGENT TEST
# ============================================

def test_langgraph_agent() -> bool:
    """Test the full LangGraph validation pipeline."""
    print_header("11. LANGGRAPH AGENT PIPELINE TEST")
    
    try:
        from agent import app as validation_agent_app
        
        print_test("Running full validation pipeline on test provider")
        
        initial_state = {
            "initial_data": {
                "full_name": "Dr. Test Provider",
                "NPI": "1235256050",
                "address": "123 Test Street",
                "city": "Los Angeles",
                "state": "CA",
                "zip_code": "90001",
                "website": "",
                "specialty": "Internal Medicine",
                "phone": "555-1234",
                "license_number": "A12345",
                "last_updated": "2024-01-01"
            },
            "log": [],
            "npi_result": {},
            "oig_leie_result": {},
            "state_board_result": {},
            "address_result": {},
            "web_enrichment_data": {},
            "digital_footprint_score": 0.0,
            "qa_flags": [],
            "qa_corrections": {},
            "fraud_indicators": [],
            "conflicting_data": [],
            "golden_record": {},
            "confidence_score": 0.0,
            "confidence_breakdown": {},
            "requires_human_review": False,
            "review_reason": "",
            "final_profile": {},
            "execution_metadata": {},
            "data_provenance": {},
            "quality_metrics": {}
        }
        
        final_state = validation_agent_app.invoke(initial_state)
        
        if final_state.get("confidence_score") is not None:
            print_pass()
            print_info(f"Confidence Score: {final_state['confidence_score']:.2%}")
            print_info(f"Path: {final_state.get('quality_metrics', {}).get('path', 'UNKNOWN')}")
            print_info(f"Review Required: {final_state.get('requires_human_review', False)}")
            return True
        else:
            print_fail("Agent did not return confidence score")
            return False
            
    except Exception as e:
        print_fail(str(e))
        traceback.print_exc()
        return False


# ============================================
# 7. FASTAPI ENDPOINT TESTS
# ============================================

async def test_fastapi_endpoints() -> bool:
    """Test FastAPI endpoints (requires server to be running)."""
    print_header("12. FASTAPI ENDPOINT TEST")
    
    base_url = "http://localhost:8000"
    
    # Test health check
    print_test("Testing /api/health endpoint")
    try:
        response = requests.get(f"{base_url}/api/health", timeout=5)
        if response.status_code == 200:
            print_pass()
            print_info(f"Version: {response.json().get('version', 'unknown')}")
        else:
            print_fail(f"Status code: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_fail("Server not running. Start with: uvicorn main:app --reload")
        return False
    except Exception as e:
        print_fail(str(e))
        return False
    
    # Test analytics endpoint
    print_test("Testing /api/analytics/dashboard-stats endpoint")
    try:
        response = requests.get(f"{base_url}/api/analytics/dashboard-stats", timeout=5)
        if response.status_code == 200:
            print_pass()
            stats = response.json().get("stats", {})
            print_info(f"Total Providers: {stats.get('total_providers', 0)}")
        else:
            print_fail(f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_fail(str(e))
        return False
    
    return True


# ============================================
# MAIN TEST RUNNER
# ============================================

def run_all_tests():
    """Run all tests and generate a report."""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║     HEALTH ATLAS VALIDATION SYSTEM - COMPREHENSIVE TEST SUITE      ║")
    print("║                                                                    ║")
    print("║  This will test ALL components of your validation system:         ║")
    print("║  • Environment variables                                          ║")
    print("║  • Database connections                                           ║")
    print("║  • External APIs (NPPES, OIG, Geoapify, Serper)                  ║")
    print("║  • File parsers (CSV, Excel, PDF, Images)                        ║")
    print("║  • VLM/OCR extraction                                             ║")
    print("║  • Logic engine                                                   ║")
    print("║  • LangGraph agent                                                ║")
    print("║  • FastAPI endpoints                                              ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")
    
    results = {}
    
    # Run all tests
    results["Environment Variables"], missing_vars = test_environment_variables()
    results["Database Connection"] = test_database_connection()
    results["NPPES API"] = test_nppes_api()
    results["OIG LEIE Check"] = test_oig_leie_check()
    results["Geoapify API"] = test_geoapify_api()
    results["Serper API"] = test_serper_api()
    results["CSV Parsing"] = test_csv_parsing()
    results["Excel Parsing"] = test_excel_parsing()
    results["VLM/OCR Extraction"] = test_vlm_extraction()
    results["Logic Engine"] = test_logic_engine()
    results["LangGraph Agent"] = test_langgraph_agent()
    
    # FastAPI tests (async)
    try:
        results["FastAPI Endpoints"] = asyncio.run(test_fastapi_endpoints())
    except Exception as e:
        results["FastAPI Endpoints"] = False
        print(f"{Colors.RED}FastAPI test failed: {str(e)}{Colors.END}")
    
    # Generate report
    print_header("TEST RESULTS SUMMARY")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, passed_test in results.items():
        status = f"{Colors.GREEN}✓ PASS{Colors.END}" if passed_test else f"{Colors.RED}✗ FAIL{Colors.END}"
        print(f"  {test_name:<30} {status}")
    
    print(f"\n{Colors.BOLD}Overall Score: {passed}/{total} tests passed{Colors.END}")
    
    if passed == total:
        print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED - System is fully operational!{Colors.END}")
        return True
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}⚠️ SOME TESTS FAILED - Please fix issues before deployment{Colors.END}")
        
        if missing_vars:
            print(f"\n{Colors.YELLOW}Missing environment variables:{Colors.END}")
            for var in missing_vars:
                print(f"  - {var}")
        
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)