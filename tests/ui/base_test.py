"""Base test class for UI tests using Playwright and unittest.

Tests use real backend API at localhost:8000 - no mocking.
"""

import os
import unittest
from typing import Dict, Optional

from playwright.sync_api import Browser, BrowserContext, Page, Playwright, sync_playwright


class BaseUITest(unittest.TestCase):
    """Base class for all UI tests providing browser setup.
    
    Tests call real backend API - no mocking. The backend must be running
    at localhost:8000 and the frontend at localhost:3000.
    """

    # Class-level browser instances
    playwright: Optional[Playwright] = None
    browsers: Dict[str, Browser] = {}
    base_url: str = ""
    backend_url: str = ""
    headless: bool = True
    browser_names: list = []

    # Fixture paths
    invoice_pdf: str = ""
    po_pdf: str = ""
    invalid_txt: str = ""
    invalid_xlsx: str = ""

    # Longer timeouts for real API calls
    API_TIMEOUT: int = 60000  # 60 seconds for API responses
    FORM_TIMEOUT: int = 30000  # 30 seconds for form to be filled

    @classmethod
    def setUpClass(cls) -> None:
        """Set up browsers for the entire test class."""
        # Configuration from environment variables
        cls.base_url = os.getenv("BASE_URL", "http://localhost:3000")
        cls.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        cls.headless = os.getenv("HEADLESS", "false").lower() in {"1", "true", "yes"}
        browsers_env = os.getenv("BROWSERS", "chromium")
        cls.browser_names = [b.strip().lower() for b in browsers_env.split(",") if b.strip()]

        # Start Playwright
        cls.playwright = sync_playwright().start()
        cls.browsers = {}

        # Launch browsers based on configuration
        for name in cls.browser_names:
            if name == "firefox":
                cls.browsers[name] = cls.playwright.firefox.launch(headless=cls.headless)
            elif name in {"edge", "msedge"}:
                cls.browsers[name] = cls.playwright.chromium.launch(
                    channel="msedge", headless=cls.headless
                )
            elif name in {"chrome", "google-chrome"}:
                cls.browsers[name] = cls.playwright.chromium.launch(
                    channel="chrome", headless=cls.headless
                )
            else:
                # Default to Chromium
                cls.browsers[name] = cls.playwright.chromium.launch(headless=cls.headless)

        # Set up fixture paths
        fixtures_dir = os.path.join(os.path.dirname(__file__), "fixtures")
        cls.invoice_pdf = os.path.join(fixtures_dir, "sample_invoice.pdf")
        cls.po_pdf = os.path.join(fixtures_dir, "sample_po.pdf")
        cls.invalid_txt = os.path.join(fixtures_dir, "invalid.txt")
        cls.invalid_xlsx = os.path.join(fixtures_dir, "invalid.xlsx")

    @classmethod
    def tearDownClass(cls) -> None:
        """Clean up browsers after all tests in the class."""
        for browser in cls.browsers.values():
            try:
                browser.close()
            except Exception:
                pass
        if cls.playwright:
            try:
                cls.playwright.stop()
            except Exception:
                pass

    def run_in_browsers(self, test_func) -> None:
        """
        Run a test function in all configured browsers.
        
        Args:
            test_func: A function that takes (page, browser_name) as arguments
        """
        for name, browser in self.browsers.items():
            with self.subTest(browser=name):
                context: BrowserContext = browser.new_context(
                    viewport={"width": 1280, "height": 720}
                )
                page: Page = context.new_page()
                
                # Set longer timeouts for real API calls
                page.set_default_timeout(self.API_TIMEOUT)
                page.set_default_navigation_timeout(self.API_TIMEOUT)
                
                # No mocking - tests use real backend API
                
                try:
                    test_func(page, name)
                finally:
                    context.close()
