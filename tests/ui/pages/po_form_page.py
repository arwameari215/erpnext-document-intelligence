"""Page Object for Purchase Order Form functionality.

Uses real backend API data - form fields populated from actual API response.
"""

from typing import Dict
from playwright.sync_api import Page, expect


class POFormPage:
    """Page Object for the PO form section of the application."""

    # Longer timeouts for real API data
    FORM_TIMEOUT = 30000  # 30 seconds for form to be filled
    API_TIMEOUT = 60000   # 60 seconds for API calls

    def __init__(self, page: Page) -> None:
        """Initialize the PO form page object."""
        self.page = page
        self.submit_button = page.locator("button:has-text('Submit to ERPNext')")
        self.add_item_button = page.locator("button:has-text('+ Add Item')")
        self.error_message = page.locator("div.bg-red-50 p")
        # Success message can appear in either format
        self.success_message = page.locator("div.bg-green-50 h3, div.bg-green-50 p")

        # Field label mappings for locator resolution
        self.field_map: Dict[str, str] = {
            "supplier_name": "Supplier Name",
            "company_name": "Company Name",
            "order_date": "Order Date",
            "delivery_date": "Delivery Date",
            "currency": "Currency",
        }

    def wait_for_form(self) -> None:
        """Wait for the PO form to be fully loaded with data from backend."""
        # Wait for form header to appear
        self.page.wait_for_selector("text=Purchase Order Form", timeout=self.FORM_TIMEOUT)
        # Wait for submit button to be visible
        self.submit_button.wait_for(state="visible", timeout=self.FORM_TIMEOUT)
        # Wait for items table to have at least one row (form is filled)
        self.page.wait_for_selector("table tbody tr", timeout=self.FORM_TIMEOUT)
        # Small delay to ensure form is fully rendered
        self.page.wait_for_timeout(1000)

    def _get_field_locator(self, label_text: str):
        """Get input/select locator by its associated label text."""
        return self.page.locator(
            f"div:has(> label:has-text('{label_text}')) input, "
            f"div:has(> label:has-text('{label_text}')) select"
        )

    def get_field_value(self, field_id: str) -> str:
        """Get the current value of a form field."""
        label_text = self.field_map[field_id]
        locator = self._get_field_locator(label_text)
        locator.first.wait_for(state="visible", timeout=5000)
        return locator.first.input_value()

    def set_field_value(self, field_id: str, value: str) -> None:
        """Set a value in a form field."""
        label_text = self.field_map[field_id]
        field = self._get_field_locator(label_text).first
        field.wait_for(state="visible", timeout=5000)
        field.clear()
        field.fill(value)

    def clear_field(self, field_id: str) -> None:
        """Clear a form field."""
        label_text = self.field_map[field_id]
        field = self._get_field_locator(label_text).first
        field.wait_for(state="visible", timeout=5000)
        field.clear()

    def click_edit(self) -> None:
        """Click on an editable field to enter edit mode."""
        field = self._get_field_locator("Supplier Name").first
        field.wait_for(state="visible", timeout=5000)
        field.click()

    def submit_form(self) -> None:
        """Click the submit button."""
        expect(self.submit_button).to_be_visible(timeout=5000)
        self.submit_button.click()

    def get_error_text(self) -> str:
        """Get the validation error message text."""
        self.error_message.first.wait_for(state="visible", timeout=5000)
        return self.error_message.first.inner_text()

    def get_validation_error(self) -> str:
        """Alias for get_error_text for API consistency."""
        return self.get_error_text()

    def get_success_text(self) -> str:
        """Get the success message text from the green success container."""
        # The success message is in h3 inside div.bg-green-50
        success_container = self.page.locator("div.bg-green-50")
        success_container.first.wait_for(state="visible", timeout=10000)
        # Get the full text content from the success container
        return success_container.first.inner_text()

    def get_first_item_field(self, field_name: str) -> str:
        """Get the value of a field in the first line item row."""
        row = self.page.locator("table tbody tr").first
        column_map = {"item_code": 0, "description": 1, "quantity": 2, "unit_price": 3}
        index = column_map[field_name]
        cell_input = row.locator("input").nth(index)
        cell_input.wait_for(state="visible", timeout=5000)
        return cell_input.input_value()

    def set_first_item_field(self, field_name: str, value: str) -> None:
        """Set a value in the first line item row."""
        row = self.page.locator("table tbody tr").first
        column_map = {"item_code": 0, "description": 1, "quantity": 2, "unit_price": 3}
        index = column_map[field_name]
        cell_input = row.locator("input").nth(index)
        cell_input.wait_for(state="visible", timeout=5000)
        cell_input.clear()
        cell_input.fill(value)
