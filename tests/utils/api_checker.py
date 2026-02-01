"""
API Availability Checker
Checks if external services are reachable before running integration tests
"""
import requests
from typing import Tuple

def check_api_availability(url: str, timeout: int = 5) -> Tuple[bool, str]:
    """
    Ping an API to check if it's available
    
    Args:
        url: Base URL to check
        timeout: Request timeout in seconds
    
    Returns:
        Tuple of (is_available, message)
    """
    try:
        response = requests.get(url, timeout=timeout)
        if response.status_code < 500:
            return True, f"API at {url} is reachable"
        else:
            return False, f"API at {url} returned {response.status_code}"
    except requests.exceptions.ConnectionError:
        return False, f"Cannot connect to {url} - Connection refused"
    except requests.exceptions.Timeout:
        return False, f"Timeout connecting to {url}"
    except Exception as e:
        return False, f"Error checking {url}: {str(e)}"


def check_erpnext_availability(base_url: str) -> Tuple[bool, str]:
    """Check if ERPNext is available"""
    return check_api_availability(f"{base_url}/api/method/frappe.auth.get_logged_user")


def check_pdf_api_availability(base_url: str) -> Tuple[bool, str]:
    """Check if PDF extraction API is available"""
    return check_api_availability(f"{base_url}/health")


def check_ui_availability(base_url: str) -> Tuple[bool, str]:
    """Check if UI application is available"""
    return check_api_availability(base_url)
