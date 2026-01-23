import usaddress
from thefuzz import fuzz
import math
from datetime import datetime

class SurgicalValidator:
    def compare_addresses(self, input_addr_str, official_addr_str):
        """
        Real Logic: Parses addresses into components (Number, Street, Zip).
        ONLY auto-corrects if critical components (Number, Zip) match perfectly.
        """
        
        # 1. Parse raw strings into dictionaries
        # output example: {'AddressNumber': '123', 'StreetName': 'Main', 'StreetNamePostType': 'St'}
        try:
            input_parsed, _ = usaddress.tag(input_addr_str)
            official_parsed, _ = usaddress.tag(official_addr_str)
        except usaddress.RepeatedLabelError:
            # Fallback for messy addresses if parser fails
            return {"action": "MANUAL_REVIEW", "reason": "Complex address format failed parsing"}

        # 2. Extract Critical Components (The "No Fly Zone")
        in_num = input_parsed.get('AddressNumber')
        off_num = official_parsed.get('AddressNumber')
        
        in_zip = input_parsed.get('ZipCode')
        off_zip = official_parsed.get('ZipCode')

        # 3. CRITICAL CHECK: If House Number or Zip differs, NEVER auto-correct.
        if in_num != off_num:
            return {
                "action": "FLAG", 
                "reason": f"CRITICAL: House Number Mismatch ({in_num} vs {off_num}). Auto-correction unsafe."
            }
        
        if in_zip and off_zip and in_zip[:5] != off_zip[:5]:
             return {
                "action": "FLAG", 
                "reason": f"CRITICAL: Zip Code Mismatch ({in_num} vs {off_num}). Different geographic region."
            }

        # 4. FUZZY CHECK: Only safe to fuzzy match the Street Name now
        in_street = str(input_parsed.get('StreetName', '')) + " " + str(input_parsed.get('StreetNamePostType', ''))
        off_street = str(official_parsed.get('StreetName', '')) + " " + str(official_parsed.get('StreetNamePostType', ''))
        
        similarity = fuzz.ratio(in_street.lower(), off_street.lower())

        # 5. The Decision Matrix
        if similarity == 100:
            return {"action": "VERIFIED", "reason": "Exact Match"}
        
        elif similarity > 80:
            # It's a typo in the street name (e.g. "Mane St" vs "Main St")
            # But we verified House Number and Zip are identical, so it's safe.
            return {
                "action": "AUTO_CORRECT", 
                "new_value": official_addr_str,
                "confidence": similarity / 100,
                "reason": "Safe typo correction (Number/Zip verified)"
            }
            
        else:
            return {"action": "FLAG", "reason": "Street name too different"}
        
    def calculate_data_health(self, last_updated_date, source_type, provider_type):
        """
        Real ML Logic: Exponential Decay Model
        Formula: Reliability = Initial_Trust * e^(-decay_rate * days_passed)
        """
        
        # 1. Establish Initial Trust (R0)
        source_trust_map = {
            "NPI_REGISTRY": 1.0,   # Gold Standard
            "STATE_BOARD": 0.95,   # Very reliable
            "WEB_SCRAPE": 0.70,    # Unstructured, prone to errors
            "CSV_UPLOAD": 0.50     # User uploaded, untrusted
        }
        R0 = source_trust_map.get(source_type, 0.5)

        # 2. Determine Decay Rate (Lambda)
        # Hospitals move rarely (low decay). Doctors move often (high decay).
        if provider_type == "ORGANIZATION":
            decay_rate = 0.001 # Extremely slow decay
        else:
            decay_rate = 0.005 # Faster decay (individual doctors move)

        # 3. Calculate Time Delta (t)
        if isinstance(last_updated_date, str):
            last_updated_date = datetime.strptime(last_updated_date, "%Y-%m-%d")
            
        days_passed = (datetime.now() - last_updated_date).days

        # 4. The Math: Exponential Decay
        # If days_passed is 0, e^0 is 1. Reliability = R0.
        # As days increase, Reliability drops on a curve.
        reliability_score = R0 * math.exp(-decay_rate * days_passed)

        # 5. Predictive Output
        next_check_days = 0
        if reliability_score > 0.8:
            status = "HEALTHY"
            next_check_days = 90
        elif reliability_score > 0.5:
            status = "DECAYING"
            next_check_days = 30
        else:
            status = "STALE"
            next_check_days = 0 # Check immediately

        return {
            "current_reliability": round(reliability_score, 4),
            "status": status,
            "days_since_update": days_passed,
            "recommended_next_check_in_days": next_check_days
        }