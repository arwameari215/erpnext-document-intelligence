"""
Pytest configuration and fixtures for UI tests using Playwright.
Provides browser fixtures, page fixtures with network stubs, and test data.
"""

import json
import os
import pytest
from playwright.sync_api import Page, Browser, Playwright


# ============================================================================
# Configuration from environment variables
# ============================================================================

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")
HEADLESS = os.getenv("HEADLESS", "false").lower() in {"1", "true", "yes"}


# ============================================================================
# Fixture paths
# ============================================================================

FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")
INVOICE_PDF = os.path.join(FIXTURES_DIR, "sample_invoice.pdf")
PO_PDF = os.path.join(FIXTURES_DIR, "sample_po.pdf")
INVALID_TXT = os.path.join(FIXTURES_DIR, "invalid.txt")
INVALID_XLSX = os.path.join(FIXTURES_DIR, "invalid.xlsx")


# ============================================================================
# Mock API payloads for network stubbing
# ============================================================================

INVOICE_UPLOAD_RESPONSE = {
    "confidence": 0.92,
    "predictionTime": 1.23,
    "data": {
        "InvoiceId": "INV-1001",
        "VendorName": "Acme Supplies",
        "InvoiceDate": "2025-12-01",
        "DueDate": "2025-12-15",
        "BillingAddressRecipient": "Acme Supplies",
        "ShippingAddress": "123 Road, Metropolis",
        "Currency": "USD",
        "SubTotal": 100.0,
        "ShippingCost": 10.0,
        "Tax": 5.0,
        "InvoiceTotal": 115.0,
        "Items": [
            {
                "description": "Widget A",
                "category": "Widgets",
                "quantity": 2,
                "rate": 50.0,
                "amount": 100.0
            }
        ]
    }
}

PO_UPLOAD_RESPONSE = {
    "po_number": "PO-2001",
    "date": "2025-12-05",
    "delivery_date": "2025-12-20",
    "supplier_name": "Global Parts",
    "company_name": "My Company",
    "currency": "USD",
    "total_amount": 500.0,
    "status": "Draft",
    "items": [
        {
            "item_code": "ITEM-001",
            "item_name": "Bolt",
            "description": "Bolt",
            "quantity": 10,
            "unit_price": 5.0,
            "total": 50.0
        }
    ]
}

COMPANY_RESPONSE = {"success": True, "data": {"default_currency": "USD"}}

INVOICE_SUBMIT_RESPONSE = {
    "invoice_name": "SINV-0001",
    "invoice_data": {"name": "SINV-0001"},
    "status_log": ["Created invoice"]
}

PO_SUBMIT_RESPONSE = {
    "po_name": "PO-0001",
    "po_data": {"name": "PO-0001"},
    "status_log": ["Created PO"]
}


# ============================================================================
# Pytest fixtures
# ============================================================================

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    """Configure browser context with viewport and other settings."""
    return {
        **browser_context_args,
        "viewport": {"width": 1280, "height": 720},
    }


@pytest.fixture(scope="function")
def stubbed_page(page: Page) -> Page:
    """
    Provides a Playwright page with all API routes stubbed for UI-only testing.
    This intercepts network requests and returns mock data.
    """
    # Stub invoice upload endpoint
    page.route(
        "**/upload/invoice",
        lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(INVOICE_UPLOAD_RESPONSE)
        )
    )

    # Stub PO upload endpoint
    page.route(
        "**/upload/po",
        lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(PO_UPLOAD_RESPONSE)
        )
    )

    # Stub company details endpoint
    page.route(
        "**/erpnext/company/**",
        lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(COMPANY_RESPONSE)
        )
    )

    # Stub sales invoice submission endpoint
    page.route(
        "**/erpnext/sales-invoice",
        lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(INVOICE_SUBMIT_RESPONSE)
        )
    )

    # Stub purchase order submission endpoint
    page.route(
        "**/erpnext/purchase-order",
        lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(PO_SUBMIT_RESPONSE)
        )
    )

    return page


@pytest.fixture
def base_url() -> str:
    """Returns the base URL for the application."""
    return BASE_URL


@pytest.fixture
def invoice_pdf() -> str:
    """Returns the path to the sample invoice PDF fixture."""
    return INVOICE_PDF


@pytest.fixture
def po_pdf() -> str:
    """Returns the path to the sample PO PDF fixture."""
    return PO_PDF


@pytest.fixture
def invalid_txt() -> str:
    """Returns the path to the invalid TXT fixture."""
    return INVALID_TXT


@pytest.fixture
def invalid_xlsx() -> str:
    """Returns the path to the invalid XLSX fixture."""
    return INVALID_XLSX
