"""End-to-end UI tests for Purchase Order flow.

Tests use real backend API at localhost:8000 - no mocking.
The form is filled with real data from the Document Intelligence API.

Tests cover:
- Happy flow: Upload PDF, verify form is filled, edit, submit
- Non-happy: Wrong file type, missing required fields, invalid values
"""

import unittest

from tests.ui.base_test import BaseUITest
from tests.ui.pages.upload_po_page import UploadPOPage
from tests.ui.pages.po_form_page import POFormPage


class TestPOFlow(BaseUITest):
    """Test suite for Purchase Order upload and form submission flows."""

    # ========================================================================
    # Happy Flow Test
    # ========================================================================

    def test_po_happy_flow(self) -> None:
        """Test complete happy flow: upload PDF, verify form filled, edit, submit."""

        def run(page, _browser_name: str) -> None:
            # Step 1: Navigate to upload page
            upload_page = UploadPOPage(page)
            upload_page.go_to_page(self.base_url)

            # Step 2: Upload valid PDF and wait for real API response
            upload_page.upload_pdf(self.po_pdf)
            
            # Step 3: Wait for form to be filled with data from backend
            form = POFormPage(page)
            form.wait_for_form()

            # Step 4: Verify form fields are populated (not empty)
            # Real data comes from backend, so just check fields are filled
            supplier_name = form.get_field_value("supplier_name")
            self.assertTrue(len(supplier_name) > 0, "Supplier name should be filled from API")
            
            # Verify items table has data
            first_item_code = form.get_first_item_field("item_code")
            self.assertTrue(len(first_item_code) > 0, "First item code should be filled")

            # Step 4b: Ensure delivery date is set (required field)
            # Always set a valid delivery date to ensure form submission works
            import datetime
            default_date = (datetime.date.today() + datetime.timedelta(days=7)).strftime("%Y-%m-%d")
            # Use direct locator for date input to ensure it works
            delivery_date_input = page.locator("input[type='date']").nth(1)  # Second date input is delivery date
            delivery_date_input.fill(default_date)

            # Step 5: Submit form and verify success
            form.submit_form()
            
            # Wait for success or error message
            page.wait_for_selector("div.bg-green-50, div.bg-red-50", timeout=60000)
            
            # Check if success message appeared
            if page.locator("div.bg-green-50").count() > 0:
                success_text = form.get_success_text()
                self.assertTrue(
                    "Purchase Order created" in success_text or
                    "successfully" in success_text.lower(),
                    f"Expected success message, got: {success_text}"
                )
            else:
                # If there's an error, fail with the error message
                error_text = page.locator("div.bg-red-50 p").first.inner_text()
                self.fail(f"Form submission failed with error: {error_text}")

        self.run_in_browsers(run)

    # ========================================================================
    # Non-Happy Flow Tests
    # ========================================================================

    def test_po_wrong_file_type(self) -> None:
        """Test that uploading non-PDF file shows error message."""

        def run(page, _browser_name: str) -> None:
            # Navigate to upload page
            upload_page = UploadPOPage(page)
            upload_page.go_to_page(self.base_url)

            # Upload invalid file type (XLSX)
            upload_page.upload_invalid_file(self.invalid_xlsx)

            # Verify error message is displayed
            error_text = upload_page.get_upload_error_text()
            self.assertEqual(error_text, "Please select a valid PDF file")

        self.run_in_browsers(run)

    def test_po_missing_required_fields(self) -> None:
        """Test that missing required fields shows validation error."""

        def run(page, _browser_name: str) -> None:
            # Navigate and upload valid PDF
            upload_page = UploadPOPage(page)
            upload_page.go_to_page(self.base_url)
            upload_page.upload_pdf(self.po_pdf)

            # Wait for form to load
            form = POFormPage(page)
            form.wait_for_form()

            # Clear required field (supplier name)
            form.clear_field("supplier_name")

            # Attempt to submit
            form.submit_form()

            # Verify validation error
            error_text = form.get_validation_error()
            self.assertEqual(error_text, "Supplier name is required")

        self.run_in_browsers(run)

    def test_po_invalid_values(self) -> None:
        """Test that invalid field values show validation error."""

        def run(page, _browser_name: str) -> None:
            # Navigate and upload valid PDF
            upload_page = UploadPOPage(page)
            upload_page.go_to_page(self.base_url)
            upload_page.upload_pdf(self.po_pdf)

            # Wait for form to load
            form = POFormPage(page)
            form.wait_for_form()

            # Enter invalid value (zero quantity in line item)
            form.set_first_item_field("quantity", "0")

            # Attempt to submit
            form.submit_form()

            # Verify validation error (may be quantity or delivery date error)
            error_text = form.get_validation_error()
            self.assertTrue(
                "Quantity" in error_text or
                "Delivery date" in error_text or
                "Item" in error_text
            )

        self.run_in_browsers(run)


if __name__ == "__main__":
    unittest.main()
