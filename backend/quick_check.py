"""
QUICK HEALTH CHECK - 60 Second System Diagnostic
=================================================

Run this script for a quick sanity check before deploying or debugging.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env from root directory (parent of backend)
root_dir = Path(__file__).resolve().parent.parent
env_path = root_dir / '.env'
if env_path.exists():
    load_dotenv(env_path)
    print(f"📁 Loaded .env from: {env_path}\n")
else:
    print(f"⚠️  No .env file found at: {env_path}")
    print(f"   Looking for .env in current directory...\n")
    load_dotenv()  # Fallback to current directory

def check(name, condition, fix=""):
    """Quick check with visual feedback."""
    status = "✓" if condition else "✗"
    color = "\033[92m" if condition else "\033[91m"
    reset = "\033[0m"
    
    print(f"{color}{status}{reset} {name}")
    
    if not condition and fix:
        print(f"  → Fix: {fix}")
    
    return condition

def quick_check():
    print("\n" + "="*60)
    print("QUICK HEALTH CHECK - Health Atlas Validation System")
    print("="*60 + "\n")
    
    results = []
    
    # 1. Environment Variables
    print("📋 ENVIRONMENT VARIABLES:")
    results.append(check(
        "DATABASE_URL", 
        bool(os.getenv("DATABASE_URL")),
        "Set in .env file or environment"
    ))
    results.append(check(
        "GEOAPIFY_API_KEY", 
        bool(os.getenv("GEOAPIFY_API_KEY")),
        "Get free key at: https://www.geoapify.com/"
    ))
    results.append(check(
        "SERPER_API_KEY", 
        bool(os.getenv("SERPER_API_KEY")),
        "Get key at: https://serper.dev/"
    ))
    
    # VLM check (at least one needed)
    has_vlm = (
        bool(os.getenv("GEMINI_API_KEY")) or 
        bool(os.getenv("GOOGLE_API_KEY")) or
        bool(os.getenv("OPENAI_API_KEY")) or
        bool(os.getenv("ANTHROPIC_API_KEY"))
    )
    results.append(check(
        "VLM API Key (Gemini/OpenAI/Claude)", 
        has_vlm,
        "Get Gemini key (free): https://aistudio.google.com/app/apikey"
    ))
    
    # 2. Required Files
    print("\n📁 REQUIRED FILES:")
    results.append(check("agent.py", Path("agent.py").exists()))
    results.append(check("tools.py", Path("tools.py").exists()))
    results.append(check("production_tools.py", Path("production_tools.py").exists()))
    results.append(check("main.py", Path("main.py").exists()))
    results.append(check("logic_engine.py", Path("logic_engine.py").exists()))
    results.append(check("database_setup.py", Path("database_setup.py").exists()))
    
    # 3. Python Dependencies
    print("\n📦 PYTHON DEPENDENCIES:")
    try:
        import fastapi
        results.append(check("FastAPI", True))
    except ImportError:
        results.append(check("FastAPI", False, "pip install fastapi"))
    
    try:
        import psycopg2
        results.append(check("psycopg2", True))
    except ImportError:
        results.append(check("psycopg2", False, "pip install psycopg2-binary"))
    
    try:
        import pandas
        results.append(check("pandas", True))
    except ImportError:
        results.append(check("pandas", False, "pip install pandas"))
    
    try:
        import google.generativeai
        results.append(check("google-generativeai", True))
    except ImportError:
        results.append(check("google-generativeai", False, "pip install google-generativeai"))
    
    try:
        import langchain_groq
        results.append(check("langchain-groq", True))
    except ImportError:
        results.append(check("langchain-groq", False, "pip install langchain-groq"))
    
    try:
        import langgraph
        results.append(check("langgraph", True))
    except ImportError:
        results.append(check("langgraph", False, "pip install langgraph"))
    
    # 4. Database Connection
    print("\n🗄️ DATABASE:")
    if os.getenv("DATABASE_URL"):
        try:
            import psycopg2
            conn = psycopg2.connect(os.getenv("DATABASE_URL"))
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            cursor.close()
            conn.close()
            results.append(check("PostgreSQL Connection", True))
        except Exception as e:
            results.append(check("PostgreSQL Connection", False, f"Error: {str(e)[:50]}"))
    else:
        results.append(check("PostgreSQL Connection", False, "DATABASE_URL not set"))
    
    # 5. API Connectivity
    print("\n🌐 API CONNECTIVITY:")
    try:
        import requests
        response = requests.get("https://npiregistry.cms.hhs.gov/api/", timeout=5)
        results.append(check("NPPES API Reachable", response.status_code == 200))
    except:
        results.append(check("NPPES API Reachable", False, "Check internet connection"))
    
    # Summary
    print("\n" + "="*60)
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✅ ALL CHECKS PASSED ({passed}/{total})")
        print("System is ready for use!")
    elif passed >= total * 0.7:
        print(f"⚠️ MOSTLY READY ({passed}/{total})")
        print("Some optional components missing, but core system should work")
    else:
        print(f"❌ CRITICAL ISSUES ({passed}/{total})")
        print("Please fix the failed checks above before proceeding")
    
    print("="*60 + "\n")
    
    print("💡 For detailed testing, run: python test_suite.py")
    print("💡 To start the server: uvicorn main:app --reload --host 0.0.0.0 --port 8000\n")
    
    return passed == total

if __name__ == "__main__":
    success = quick_check()
    sys.exit(0 if success else 1)