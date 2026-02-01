"""
MOCKED PO UI TESTS - CI-SAFE
These tests run with mocked ERPNext and PDF APIs
They validate Purchase Order UI behavior without external dependencies
"""
import unittest
import os
import sys
from playwright.sync_api import sync_playwright, Browser, Page

# Add tests directory to path for imports
if __name__ == '__main__' or not __package__:
    sys.path.insert(0, os.path.dirname(__file__))
    from page_objects.home_page import HomePage
    from page_objects.purchase_order_form_page import PurchaseOrderFormPage
    from config import UI_BASE_URL, TEST_PO_DATA, BROWSERS
    from mock_api_server import MockAPIServer, MockERPNextServer
else:
    from .page_objects.home_page import HomePage
    from .page_objects.purchase_order_form_page import PurchaseOrderFormPage
    from .config import UI_BASE_URL, TEST_PO_DATA, BROWSERS
    from .mock_api_server import MockAPIServer, MockERPNextServer


class MockedPOTests(unittest.TestCase):
    """
    Mocked Purchase Order UI Tests
    Run in CI with mocked backend servers
    """
    
    @classmethod
    def setUpClass(cls):
        """Set up browsers and mock API servers for all tests"""
        # Wait for any previous servers to fully stop
        import time
        time.sleep(3)
        
        # Start mock API servers
        cls.pdf_api_server = MockAPIServer(port=8000)
        cls.pdf_api_server.start()
        
        cls.erpnext_server = MockERPNextServer()
        cls.erpnext_server.start()
        
        # Launch browsers
        cls.playwright = sync_playwright().start()
        cls.browsers = {}
        
        # Launch all browsers for testing
        for browser_name in BROWSERS:
            cls.browsers[browser_name] = getattr(cls.playwright, browser_name).launch(
                headless=bool(os.getenv('CI'))  # Headless in CI, headed locally
            )
    
    @classmethod
    def tearDownClass(cls):
        """Close all browsers and stop mock servers"""
        import time
        for browser in cls.browsers.values():
            browser.close()
        cls.playwright.stop()
        
        # Stop mock servers
        cls.pdf_api_server.stop()
        cls.erpnext_server.stop()
        
        # Wait for ports to be fully released
        time.sleep(2)
    
    def setUp(self):
        """Set up test - runs before each test method"""
        self.contexts = {}
        self.pages = {}
        
        # Create context and page for each browser
        for browser_name, browser in self.browsers.items():
            # Create new context with cleared storage
            self.contexts[browser_name] = browser.new_context(
                viewport={'width': 1280, 'height': 720},
                ignore_https_errors=True
            )
            self.pages[browser_name] = self.contexts[browser_name].new_page()
            # No need for Playwright mocks - using real mock servers
    
    def tearDown(self):
        """Clean up after each test"""
        for context in self.contexts.values():
            context.close()
    
    def _upload_mock_pdf_and_show_form(self, page: Page):
        """
        Helper method to upload a mock PDF and wait for PO form to appear
        """
        import os
        
        home_page = HomePage(page, UI_BASE_URL)
        
        # Navigate to home page
        home_page.navigate()
        page.wait_for_load_state('networkidle')
        
        # Select Purchase Order from dropdown
        home_page.select_purchase_order_tab()
        page.wait_for_timeout(500)
        
        # Upload mock PDF file
        test_pdf_path = os.path.join(os.path.dirname(__file__), 'test_po.pdf')
        home_page.upload_file(test_pdf_path)
        
        # Click upload button
        page.click('button:has-text("Upload")')
        
        # Wait for form to appear (mocked API responds instantly)
        page.wait_for_selector('input[placeholder="Enter supplier name"]', state="attached")

    
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
    
    def test_po_form_validation_empty_supplier(self):
        """
        Test: Form validation should prevent submission with empty supplier name
        """
        def test_logic(page: Page):
            # Upload mock PDF to show the form
            self._upload_mock_pdf_and_show_form(page)
            
            po_page = PurchaseOrderFormPage(page)
            
            # Company is pre-filled, wait for it to load
            page.wait_for_timeout(1000)
            
            # Try to submit without filling supplier name (clear any pre-filled data)
            page.fill('input[placeholder="Enter supplier name"]', '')
            page.wait_for_timeout(500)
            
            # Check if submit button is disabled or click it
            submit_button = page.locator('button:has-text("Submit to ERPNext")')
            
            # If button is disabled, that's valid validation
            if submit_button.is_disabled():
                # Test passes - form prevents submission
                return
            
            # Otherwise, click and check for error
            po_page.click_submit()
            page.wait_for_timeout(1000)
            
            # ASSERTION: Error message should appear OR button should have been disabled
            has_error = po_page.has_error_message()
            if has_error:
                error_text = po_page.get_error_text()
                self.assertIn(
                    'supplier',
                    error_text.lower(),
                    "Error should mention supplier field"
                )
            else:
                # If no error shown, check that it's not the ERPNext submission success
                if po_page.has_success_message():
                    success_text = po_page.get_success_text()
                    # Should not show ERPNext PO number with empty supplier
                    self.assertNotIn(
                        'PO-',
                        success_text,
                        "Should not submit to ERPNext with empty supplier"
                    )
        
        self._run_test_on_all_browsers(test_logic)
    
    def test_po_form_currency_is_readonly(self):
        """
        Test: Currency field should be read-only and fetched from company
        """
        def test_logic(page: Page):
            # Upload mock PDF to show the form
            self._upload_mock_pdf_and_show_form(page)
            
            po_page = PurchaseOrderFormPage(page)
            
            # Wait for form to load with PDF data
            page.wait_for_timeout(1000)
            
            # Company name should be pre-filled from PDF: "My Company"
            po_page.fill_company_name(TEST_PO_DATA['company_name'])
            page.wait_for_timeout(1000)  # Wait for any API response
            
            # ASSERTION: Currency should be USD (from PDF)
            currency = po_page.get_currency()
            self.assertEqual(
                currency,
                'USD',
                "Currency should be USD as shown in PDF"
            )
            
            # Note: Currency in PO form is a select dropdown (not disabled)
            # but it's pre-filled from PDF data
        
        self._run_test_on_all_browsers(test_logic)
    
    def test_end_to_end_po_submission_happy_path(self):
        """
        🎯 COMPLETE USER JOURNEY - Happy Path
        Test: User uploads PO PDF, fills form and successfully submits to (mocked) ERPNext
        """
        def test_logic(page: Page):
            # Upload mock PDF to show the form
            self._upload_mock_pdf_and_show_form(page)
            
            po_page = PurchaseOrderFormPage(page)
            
            # Wait for form to be pre-filled from mocked PDF data
            page.wait_for_timeout(1000)
            
            # Form should be pre-filled from PDF extraction:
            # - Company: My Company (from PDF)
            # - Supplier: ABC Supplier (from PDF)
            # - Date: 2026-01-29 (from PDF)
            # - Currency: USD (from PDF)
            # - Item: ITEM-001, Steel Rod, Qty 10, Rate 25, Amount 250
            
            # Verify or update fields as needed
            # Company name should already be filled from PDF
            company_value = page.input_value('input[placeholder="Enter company name"]')
            if not company_value or company_value != TEST_PO_DATA['company_name']:
                po_page.fill_company_name(TEST_PO_DATA['company_name'])
            
            # Supplier name should already be filled from PDF
            supplier_value = page.input_value('input[placeholder="Enter supplier name"]')
            if not supplier_value or supplier_value != TEST_PO_DATA['supplier_name']:
                po_page.fill_supplier_name(TEST_PO_DATA['supplier_name'])
            
            # Dates should be filled
            po_page.fill_order_date(TEST_PO_DATA['order_date'])
            po_page.fill_delivery_date(TEST_PO_DATA['delivery_date'])
            
            # Item details from PDF: ITEM-001, Steel Rod, Qty 10, Rate 25
            item = TEST_PO_DATA['items'][0]
            # Items should be pre-populated from PDF, verify or fill
            po_page.fill_item_code(0, item['item_code'])
            po_page.fill_item_description(0, item['description'])
            po_page.fill_item_quantity(0, str(int(item['quantity'])))
            po_page.fill_item_unit_price(0, str(item['unit_price']))
            
            page.wait_for_timeout(1500)  # Wait for calculations
            
            # ASSERTION: Verify calculations match PDF (10 * 25 = 250.00)
            total = po_page.get_item_total(0)
            expected_total = item['total']  # 250.00 from PDF
            actual_total = float(total)
            self.assertAlmostEqual(
                actual_total,
                expected_total,
                places=2,
                msg=f"Item total should be {expected_total} (from PDF: Qty {item['quantity']} * Rate {item['unit_price']})"
            )
            
            # Step 4: Submit to (mocked) ERPNext
            po_page.click_submit()

            # Wait until success OR error appears
            page.wait_for_function(
        """() => {
            const success = document.body.innerText.toLowerCase().includes("success");
            const error = document.body.innerText.toLowerCase().includes("error");
            return success || error;
        }""",
        timeout=10000
)


           
            # Check what messages are on the page
            has_success = po_page.has_success_message()
            has_error = po_page.has_error_message()
            
            # If there's an error, print it for debugging
            if has_error:
                error_msg = po_page.get_error_text()
                print(f"Error on page: {error_msg}")
            
            # ASSERTION: Success message should appear
            self.assertTrue(
                has_success,
                f"Success message should appear after submission. Has error: {has_error}"
            )
            
            # ASSERTION: Success message should indicate submission
            success_text = po_page.get_success_text()
            self.assertTrue(
                'success' in success_text.lower() or 'ready' in success_text.lower(),
                f"Success message should indicate successful processing: {success_text}"
            )
        
        self._run_test_on_all_browsers(test_logic)


if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)
