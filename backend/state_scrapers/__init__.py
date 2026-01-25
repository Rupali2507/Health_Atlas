"""
State License Scrapers Package
File: backend/state_scrapers/__init__.py

This package contains state-specific medical license verification scrapers.
Each state has its own module with a verification function.
"""

from .ca import verify_california_medical_board
from .tx import verify_texas_medical_board
from .fl import verify_florida_medical_board
from .ny import verify_new_york_medical_board
from .il import verify_illinois_medical_board
from .pa import verify_pennsylvania_medical_board
from .oh import verify_ohio_medical_board
from .mi import verify_michigan_medical_board
from .nc import verify_north_carolina_medical_board
from .ga import verify_georgia_medical_board


# State scraper registry - maps state codes to their verification functions
STATE_SCRAPERS = {
    "CA": verify_california_medical_board,
    "TX": verify_texas_medical_board,
    "FL": verify_florida_medical_board,
    "NY": verify_new_york_medical_board,
    "IL": verify_illinois_medical_board,
    "PA": verify_pennsylvania_medical_board,
    "OH": verify_ohio_medical_board,
    "MI": verify_michigan_medical_board,
    "NC": verify_north_carolina_medical_board,
    "GA": verify_georgia_medical_board,
}

# List of supported states
SUPPORTED_STATES = list(STATE_SCRAPERS.keys())


def get_scraper(state_code: str):
    """
    Get the appropriate scraper function for a given state code.
    
    Args:
        state_code: Two-letter state code (e.g., 'CA', 'TX')
        
    Returns:
        Verification function for the state, or None if not supported
    """
    return STATE_SCRAPERS.get(state_code.upper())


def is_state_supported(state_code: str) -> bool:
    """
    Check if automated verification is supported for a state.
    
    Args:
        state_code: Two-letter state code
        
    Returns:
        True if state has automated scraper, False otherwise
    """
    return state_code.upper() in SUPPORTED_STATES


__all__ = [
    'verify_california_medical_board',
    'verify_texas_medical_board',
    'verify_florida_medical_board',
    'verify_new_york_medical_board',
    'verify_illinois_medical_board',
    'verify_pennsylvania_medical_board',
    'verify_ohio_medical_board',
    'verify_michigan_medical_board',
    'verify_north_carolina_medical_board',
    'verify_georgia_medical_board',
    'STATE_SCRAPERS',
    'SUPPORTED_STATES',
    'get_scraper',
    'is_state_supported',
]