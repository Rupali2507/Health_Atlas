from datetime import datetime

def mock_license_response(
    state_code: str,
    license_number: str,
    provider_name: str
) -> dict:
    return {
        "verified": True,
        "state": state_code,
        "license_number": license_number,
        "provider_name": provider_name or "John Doe",
        "status": "Active",
        "expiration_date": "2026-06-30",
        "name_match": True,
        "has_disciplinary_actions": False,
        "active": True,
        "source": f"{state_code} Medical Board (Mock)",
        "verification_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
