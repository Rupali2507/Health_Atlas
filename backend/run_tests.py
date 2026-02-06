#!/usr/bin/env python3
"""
ONE-COMMAND SYSTEM TEST
=======================

Usage: python run_tests.py

This script will:
1. Check your environment
2. Test all components
3. Generate a detailed report
4. Give you actionable next steps
"""

import subprocess
import sys
from pathlib import Path

def main():
    print("""
    ╔════════════════════════════════════════════════════════════════╗
    ║           HEALTH ATLAS VALIDATION SYSTEM                       ║
    ║              Comprehensive System Test                         ║
    ╚════════════════════════════════════════════════════════════════╝
    
    This will run a complete system check. Please wait...
    """)
    
    # Step 1: Quick Check
    print("\n[1/2] Running Quick Health Check...")
    print("─" * 60)
    
    try:
        result = subprocess.run(
            [sys.executable, "quick_check.py"],
            capture_output=True,
            text=True
        )
        print(result.stdout)
        
        if result.returncode == 0:
            print("\n✅ Quick check passed! Proceeding to detailed tests...\n")
        else:
            print("\n⚠️ Quick check found issues. Proceeding anyway...\n")
    except FileNotFoundError:
        print("❌ quick_check.py not found. Skipping to detailed tests...\n")
    
    # Step 2: Full Test Suite
    print("\n[2/2] Running Comprehensive Test Suite...")
    print("─" * 60)
    print("⏳ This may take 3-5 minutes...\n")
    
    try:
        result = subprocess.run(
            [sys.executable, "test_suite.py"],
            capture_output=True,
            text=True
        )
        print(result.stdout)
        
        if result.stderr:
            print("\n⚠️ Warnings/Errors:")
            print(result.stderr)
        
        if result.returncode == 0:
            print("\n" + "="*60)
            print("🎉 ALL TESTS PASSED - YOUR SYSTEM IS READY!")
            print("="*60)
            print("\nNext steps:")
            print("  1. Start the server: uvicorn main:app --reload")
            print("  2. Open browser: http://localhost:8000/docs")
            print("  3. Upload a test CSV/PDF file")
            print("  4. Check the analytics dashboard")
            return 0
        else:
            print("\n" + "="*60)
            print("❌ SOME TESTS FAILED")
            print("="*60)
            print("\nPlease review the failures above and:")
            print("  1. Check TROUBLESHOOTING.md for solutions")
            print("  2. Verify your .env file has all required API keys")
            print("  3. Ensure PostgreSQL is running")
            print("  4. Run: pip install -r requirements.txt")
            return 1
            
    except FileNotFoundError:
        print("❌ test_suite.py not found!")
        print("\nPlease ensure you have these files:")
        print("  - test_suite.py")
        print("  - quick_check.py")
        print("  - agent.py")
        print("  - tools.py")
        print("  - production_tools.py")
        print("  - main.py")
        return 1
    except KeyboardInterrupt:
        print("\n\n⚠️ Tests interrupted by user")
        return 1

if __name__ == "__main__":
    sys.exit(main())