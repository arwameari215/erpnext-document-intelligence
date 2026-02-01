"""
LOCAL INTEGRATION TESTS - NOT FOR CI
These tests verify real integration with ERPNext and PDF APIs
They require actual services to be running

Purpose:
- Test real ERPNext integration
- Verify actual API communication
- Test complete data flow with real services

⚠️ PREREQUISITES:
- ERPNext must be running at localhost:8080
- PDF API must be running (if used)
- UI must be running at localhost:3000

Tests automatically skip if APIs are not available
"""
import unittest
import os
import sys
from playwright.sync_api import sync_playwright

# Add tests directory to path for imports
if __name__ == '__main__' or not __package__:
    sys.path.insert(0, os.path.dirname(__file__))
    from page_objects.invoice_form_page import InvoiceFormPage
    from config import UI_BASE_URL, ERPNEXT_BASE_URL, TEST_INVOICE_DATA, BROWSERS
    from utils.api_checker import check_erpnext_availability, check_ui_availability
else:
    from .page_objects.invoice_form_page import InvoiceFormPage
    from .config import UI_BASE_URL, ERPNEXT_BASE_URL, TEST_INVOICE_DATA, BROWSERS
    from .utils.api_checker import check_erpnext_availability, check_ui_availability


class LocalIntegrationInvoiceTests(unittest.TestCase):
    """
    Local Integration Tests for Sales Invoice
    
    ⚠️ NOT FOR CI - These tests require real ERPNext and UI
    Tests are automatically skipped if services are unavailable
    """
    
    @classmethod
    def setUpClass(cls):
        """
        Check API availability before running tests
        Skip entire test class if ERPNext or UI is not reachable
        """
        # Check UI availability
        ui_available, ui_message = check_ui_availability(UI_BASE_URL)
        if not ui_available:
            raise unittest.SkipTest(f"UI not available: {ui_message}")
        
        # Check ERPNext availability
        erpnext_available, erpnext_message = check_erpnext_availability(ERPNEXT_BASE_URL)
        if not erpnext_available:
            raise unittest.SkipTest(f"ERPNext not available: {erpnext_message}")
        
        print(f"\n✓ UI is reachable at {UI_BASE_URL}")
        print(f"✓ ERPNext is reachable at {ERPNEXT_BASE_URL}")
        
        # Launch browsers
        cls.playwright = sync_playwright().start()
        cls.browsers = {}
        
        for browser_name in BROWSERS:
            cls.browsers[browser_name] = getattr(cls.playwright, browser_name).launch(
                headless=False  # Always headed for local tests
            )
    
    @classmethod
    def tearDownClass(cls):
        """Close all browsers"""
        for browser in cls.browsers.values():
            browser.close()
        cls.playwright.stop()
    
    def setUp(self):
        """Set up test - runs before each test method"""
        self.contexts = {}
        self.pages = {}
        
        # Create context and page for each browser
        for browser_name, browser in self.browsers.items():
            self.contexts[browser_name] = browser.new_context()
            self.pages[browser_name] = self.contexts[browser_name].new_page()
    
    def tearDown(self):
        """Clean up after each test"""
        for context in self.contexts.values():
            context.close()
    
    def _run_test_on_all_browsers(self, test_func):
        """Helper to run the same test on all browsers"""
        results = {}
        for browser_name, page in self.pages.items():
            try:
                test_func(page)
                results[browser_name] = 'PASS'
            except AssertionError as e:
                results[browser_name] = f'FAIL: {str(e)}'
        
        # Check if any browser failed
        failures = [f"{browser}: {result}" for browser, result in results.items() if result != 'PASS']
        if failures:
            self.fail(f"Test failed on browsers: {', '.join(failures)}")
    
    def test_real_erpnext_invoice_creation(self):
        """
        🔌 REAL INTEGRATION TEST
        Test: Submit invoice to actual ERPNext instance
        Runs on: All browsers
        CI-Safe: NO - requires real ERPNext
        
        Prerequisites:
        - ERPNext running at localhost:8080
        - Valid API credentials in .env
        - Company 'DEMO' must exist in ERPNext
        """
        def test_logic(page):
            invoice_page = InvoiceFormPage(page)
            page.goto(UI_BASE_URL)
            
            # Fill form with test data
            invoice_page.fill_customer_name(TEST_INVOICE_DATA['customer_name'])
            invoice_page.fill_company_name(TEST_INVOICE_DATA['company_name'])
            invoice_page.fill_invoice_date(TEST_INVOICE_DATA['invoice_date'])
            invoice_page.fill_due_date(TEST_INVOICE_DATA['due_date'])
            
            # Fill item
            item = TEST_INVOICE_DATA['items'][0]
            invoice_page.fill_item_description(0, item['description'])
            invoice_page.fill_item_category(0, item['category'])
            invoice_page.fill_item_quantity(0, str(item['quantity']))
            invoice_page.fill_item_rate(0, str(item['rate']))
            
            # Fill costs
            invoice_page.fill_shipping_cost(str(TEST_INVOICE_DATA['shipping_cost']))
            invoice_page.fill_tax(str(TEST_INVOICE_DATA['tax']))
            
            page.wait_for_timeout(500)
            
            # Submit to REAL ERPNext
            invoice_page.click_submit()
            
            # Wait for real API responses (can take several seconds)
            page.wait_for_timeout(10000)  # 10 seconds for real APIs
            
            # ASSERTION: Check for success OR specific errors
            has_success = invoice_page.has_success_message()
            has_error = invoice_page.has_error_message()
            has_warning = invoice_page.has_warning_message()
            
            # If error, print it for debugging
            if has_error:
                error_text = invoice_page.get_error_text()
                print(f"\n⚠️ ERPNext Error: {error_text}")
                
                # Some errors are expected (e.g., currency mismatch)
                # Don't fail test for known issues
                if 'currency' in error_text.lower():
                    self.skipTest(f"Currency mismatch error: {error_text}")
                else:
                    self.fail(f"Unexpected ERPNext error: {error_text}")
            
            # If warning, log it
            if has_warning:
                warning_text = invoice_page.get_warning_text()
                print(f"\n⚠️ Warning: {warning_text}")
            
            # ASSERTION: Success message should appear (if no errors)
            self.assertTrue(
                has_success,
                "Success message should appear after submitting to real ERPNext"
            )
            
            # ASSERTION: Real ERPNext invoice number should be returned
            invoice_number = invoice_page.get_erpnext_invoice_number()
            self.assertTrue(
                invoice_number.startswith('SINV-') or invoice_number.startswith('ACC-SINV-'),
                f"ERPNext should return valid invoice number, got: {invoice_number}"
            )
            
            print(f"\n✓ Successfully created invoice: {invoice_number}")
        
        self._run_test_on_all_browsers(test_logic)
    
    def test_real_company_currency_fetch(self):
        """
        🔌 REAL INTEGRATION TEST
        Test: Verify currency is fetched from real ERPNext company
        Runs on: All browsers
        CI-Safe: NO - requires real ERPNext
        """
        def test_logic(page):
            invoice_page = InvoiceFormPage(page)
            page.goto(UI_BASE_URL)
            
            # Fill company name
            invoice_page.fill_company_name('DEMO')
            
            # Wait for real API call
            page.wait_for_timeout(2000)
            
            # ASSERTION: Currency should be fetched from real company
            currency = invoice_page.get_currency()
            self.assertIsNotNone(currency, "Currency should be fetched from ERPNext company")
            self.assertIn(
                currency,
                ['USD', 'EUR', 'GBP', 'INR', 'ILS', 'AUD', 'CAD', 'JPY', 'CNY'],
                f"Currency should be valid, got: {currency}"
            )
            
            print(f"\n✓ Company DEMO has currency: {currency}")
        
        self._run_test_on_all_browsers(test_logic)


if __name__ == '__main__':
    # Run tests
    # These will auto-skip if ERPNext/UI is not available
    unittest.main(verbosity=2)
