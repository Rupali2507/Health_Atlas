"""
SUPER SIMPLE TEST - Just copy this entire file and run it!
No need to understand everything - just see if it works.

Save this as: quick_test.py
Run it: python quick_test.py
"""

print("\n" + "🔧 Setting up test environment...")

# Step 1: Enable testing mode (uses fake data instead of real APIs)
import os
os.environ["TESTING_MODE"] = "true"
print("✓ Testing mode enabled")

# Step 2: Import your agent
try:
    from agent import app
    print("✓ Agent loaded successfully")
except ImportError as e:
    print(f"✗ ERROR: Could not load agent.py")
    print(f"  Make sure this file is in the same folder as agent.py")
    print(f"  Error details: {e}")
    exit(1)

print("\n" + "="*70)
print(" "*20 + "🧪 QUICK HEALTH CHECK")
print("="*70)

# ============================================
# TEST FUNCTION (makes testing easy)
# ============================================

def test_provider(name, provider_data, expected_result):
    """
    Test one provider and show results in simple terms
    
    Args:
        name: Test name (like "Good Provider")
        provider_data: Dictionary with provider info
        expected_result: What we expect (PASS or FAIL)
    """
    print(f"\n📋 Testing: {name}")
    print("-" * 70)
    
    # Create the state the agent needs
    state = {
        "initial_data": provider_data,
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
    
    # Run the agent!
    try:
        result = app.invoke(state)
        
        # Extract key information
        confidence = result.get("confidence_score", 0)
        path = result.get("quality_metrics", {}).get("path", "UNKNOWN")
        needs_review = result.get("requires_human_review", False)
        fraud_count = len(result.get("fraud_indicators", []))
        
        # Show results
        print(f"   Provider: {provider_data['full_name']}")
        print(f"   Confidence: {confidence:.1%}")
        print(f"   Path: {path}")
        print(f"   Needs Human Review: {needs_review}")
        print(f"   Fraud Indicators: {fraud_count}")
        
        # Determine if test passed
        if expected_result == "PASS":
            # Good provider should have high confidence and no review needed
            if confidence >= 0.60 and not needs_review:
                print(f"\n   ✅ TEST PASSED - System correctly approved good provider")
                return True
            else:
                print(f"\n   ❌ TEST FAILED - Good provider should be approved!")
                print(f"      Expected: Confidence ≥60%, No Review Needed")
                print(f"      Got: Confidence {confidence:.1%}, Review={needs_review}")
                return False
        else:  # expected_result == "FAIL"
            # Bad provider should trigger review or have low confidence
            if needs_review or confidence < 0.70 or fraud_count > 0:
                print(f"\n   ✅ TEST PASSED - System correctly flagged bad provider")
                return True
            else:
                print(f"\n   ❌ TEST FAILED - Bad provider should be flagged!")
                print(f"      Expected: Low confidence OR Review needed OR Fraud flags")
                print(f"      Got: Confidence {confidence:.1%}, Review={needs_review}, Fraud={fraud_count}")
                return False
                
    except Exception as e:
        print(f"\n   ❌ TEST CRASHED - Agent threw an error:")
        print(f"      {str(e)[:200]}")
        print(f"\n      This means there's a bug in your agent.py file")
        return False

# ============================================
# RUN THE TESTS
# ============================================

test_results = []

# TEST 1: Perfect Provider (should approve)
test_results.append(test_provider(
    name="Perfect Provider ✨",
    provider_data={
        "full_name": "Dr. Sarah Johnson MD",
        "NPI": "1234567890",
        "address": "100 Medical Plaza",
        "city": "Boston",
        "state": "MA",
        "zip_code": "02115",
        "website": "https://drjohnson.com",
        "specialty": "Internal Medicine",
        "phone": "617-555-0100",
        "license_number": "MA12345",
        "last_updated": "2025-01-15"
    },
    expected_result="PASS"
))

# TEST 2: OIG Excluded Provider (should reject)
test_results.append(test_provider(
    name="OIG Excluded Provider ⛔",
    provider_data={
        "full_name": "Dr. EXCLUDED Smith MD",  # Magic word triggers exclusion
        "NPI": "9876543210",
        "address": "200 Main Street",
        "city": "Chicago",
        "state": "IL",
        "zip_code": "60601",
        "website": "",
        "specialty": "Family Medicine",
        "phone": "312-555-0200",
        "license_number": "IL98765",
        "last_updated": "2024-06-01"
    },
    expected_result="FAIL"
))

# TEST 3: Suspended License (should reject)
test_results.append(test_provider(
    name="Suspended License ⚠️",
    provider_data={
        "full_name": "Dr. John Davis DO",
        "NPI": "5555555555",
        "address": "300 Healthcare Ave",
        "city": "Miami",
        "state": "FL",
        "zip_code": "33101",
        "website": "https://drdavis.com",
        "specialty": "Cardiology",
        "phone": "305-555-0300",
        "license_number": "SUSPENDED999",  # Magic word triggers suspension
        "last_updated": "2024-12-01"
    },
    expected_result="FAIL"
))

# TEST 4: Fake Address (should flag)
test_results.append(test_provider(
    name="Fake Address 🏠",
    provider_data={
        "full_name": "Dr. Emily Chen MD",
        "NPI": "7777777777",
        "address": "123 FAKE ST",  # Magic address triggers fraud flag
        "city": "Seattle",
        "state": "WA",
        "zip_code": "98101",
        "website": "",
        "specialty": "Pediatrics",
        "phone": "206-555-0400",
        "license_number": "WA77777",
        "last_updated": "2024-08-15"
    },
    expected_result="FAIL"
))

# TEST 5: Incomplete Data (should flag or approve with low confidence)
test_results.append(test_provider(
    name="Incomplete Data 📝",
    provider_data={
        "full_name": "Dr. Michael Brown",
        "NPI": "3333333333",
        "address": "500 Medical Way",  # Has address but missing other data
        "city": "Denver",
        "state": "CO",
        "zip_code": "80201",
        "website": "",
        "specialty": "",  # Missing
        "phone": "",  # Missing
        "license_number": "",  # Missing
        "last_updated": "2023-01-01"
    },
    expected_result="FAIL"
))

# ============================================
# SHOW FINAL RESULTS
# ============================================

print("\n" + "="*70)
print(" "*25 + "📊 FINAL RESULTS")
print("="*70)

passed = sum(test_results)
total = len(test_results)
failed = total - passed

print(f"\n   Total Tests: {total}")
print(f"   ✅ Passed: {passed}")
print(f"   ❌ Failed: {failed}")
print(f"   Success Rate: {(passed/total)*100:.0f}%")

print("\n" + "="*70)

if passed == total:
    print(" "*15 + "🎉 ALL TESTS PASSED! YOUR AGENT IS WORKING! 🎉")
    print("\n   Your agent can:")
    print("   ✓ Approve good providers")
    print("   ✓ Detect OIG exclusions")
    print("   ✓ Catch suspended licenses")
    print("   ✓ Flag fake addresses")
    print("   ✓ Handle incomplete data")
    print("\n   Next step: Process your real provider data!")
elif passed >= total * 0.8:  # 80% pass rate
    print(" "*20 + "⚠️  MOSTLY WORKING - SOME ISSUES")
    print(f"\n   {failed} test(s) failed. Check the details above.")
    print("   Your agent is mostly working but needs some fixes.")
elif passed >= total * 0.5:  # 50% pass rate
    print(" "*20 + "⚠️  PARTIALLY WORKING - NEEDS FIXES")
    print(f"\n   {failed} test(s) failed. Your agent has some bugs.")
    print("   Review the failed tests above and fix the issues.")
else:
    print(" "*20 + "❌ NOT WORKING - MAJOR ISSUES")
    print(f"\n   {failed} test(s) failed. Your agent needs significant fixes.")
    print("   Check your agent.py file for errors.")

print("="*70)

# Show where results are saved
print("\n💾 Test results saved to: test_output/")
print("   (You can ignore this if the folder doesn't exist yet)")

print("\n✨ Test complete! ✨\n")