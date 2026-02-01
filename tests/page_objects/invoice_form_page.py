"""
Invoice Form Page Object
Represents the Sales Invoice form with all fields and actions
"""
from playwright.sync_api import Page
from .base_page import BasePage


class InvoiceFormPage(BasePage):
    """
    Invoice Form Page
    Contains ONLY selectors and actions, NO assertions
    """
    
    # Field Selectors
    CUSTOMER_NAME_INPUT = 'input[placeholder="Enter customer name"]'
    COMPANY_NAME_INPUT = 'input[placeholder="Enter company name"]'
    CURRENCY_FIELD = 'input[readonly][disabled][type="text"]'  # Read-only currency field
    INVOICE_DATE_INPUT = 'input[type="date"]'
    DUE_DATE_INPUT = 'label:has-text("Payment Due Date") + input[type="date"]'
    SHIPPING_COST_INPUT = 'label:has-text("Shipping Cost") + input'
    TAX_INPUT = 'label:has-text("Tax") + input'
    SUBTOTAL_FIELD = 'label:has-text("Subtotal") + input'
    TOTAL_FIELD = 'label:has-text("Invoice Total") + input'
    
    # Item table selectors
    ADD_ITEM_BUTTON = 'button:has-text("Add Item")'
    ITEM_DESCRIPTION_INPUT = 'td input[placeholder="Item description"]'
    ITEM_CATEGORY_INPUT = 'td input[placeholder="Category"]'
    ITEM_QUANTITY_INPUT = 'td input[type="number"][value]:not([readonly])'
    ITEM_RATE_INPUT = 'td input[type="number"][step="0.01"]:not([readonly])'
    ITEM_AMOUNT_FIELD = 'td input[readonly]'
    REMOVE_ITEM_BUTTON = 'button:has-text("Remove")'
    
    # Action buttons
    SUBMIT_BUTTON = 'button:has-text("Submit to ERPNext")'
    CANCEL_BUTTON = 'button:has-text("Cancel")'
    
    # Status and message selectors
    SUCCESS_MESSAGE = 'div.bg-green-50'
    ERROR_MESSAGE = 'div.bg-red-50'
    WARNING_MESSAGE = 'div.bg-orange-50'
    STATUS_MESSAGES = 'div.bg-blue-50'
    ERPNEXT_INVOICE_NUMBER = 'span.font-semibold'
    LOADING_SPINNER = 'svg.animate-spin'
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    # Form field actions
    def fill_customer_name(self, name: str):
        """Fill customer name"""
        self.fill(self.CUSTOMER_NAME_INPUT, name)
    
    def fill_company_name(self, name: str):
        """Fill company name"""
        self.fill(self.COMPANY_NAME_INPUT, name)
    
    def get_currency(self) -> str:
        """Get the currency value (read-only)"""
        return self.page.locator(self.CURRENCY_FIELD).input_value()
    
    def fill_invoice_date(self, date: str):
        """Fill invoice date (format: YYYY-MM-DD)"""
        self.page.locator(self.INVOICE_DATE_INPUT).first.fill(date)
    
    def fill_due_date(self, date: str):
        """Fill payment due date (format: YYYY-MM-DD)"""
        self.fill(self.DUE_DATE_INPUT, date)
    
    def fill_shipping_cost(self, amount: str):
        """Fill shipping cost"""
        self.fill(self.SHIPPING_COST_INPUT, amount)
    
    def fill_tax(self, amount: str):
        """Fill tax amount"""
        self.fill(self.TAX_INPUT, amount)
    
    def get_subtotal(self) -> str:
        """Get subtotal value (read-only, auto-calculated)"""
        return self.page.locator(self.SUBTOTAL_FIELD).input_value()
    
    def get_total(self) -> str:
        """Get invoice total (read-only, auto-calculated)"""
        return self.page.locator(self.TOTAL_FIELD).input_value()
    
    # Item actions
    def click_add_item(self):
        """Click Add Item button"""
        self.click(self.ADD_ITEM_BUTTON)
    
    def fill_item_description(self, index: int, description: str):
        """Fill item description at given index"""
        self.page.locator(self.ITEM_DESCRIPTION_INPUT).nth(index).fill(description)
    
    def fill_item_category(self, index: int, category: str):
        """Fill item category at given index"""
        self.page.locator(self.ITEM_CATEGORY_INPUT).nth(index).fill(category)
    
    def fill_item_quantity(self, index: int, quantity: str):
        """Fill item quantity at given index"""
        self.page.locator(self.ITEM_QUANTITY_INPUT).nth(index).fill(quantity)
    
    def fill_item_rate(self, index: int, rate: str):
        """Fill item rate at given index"""
        self.page.locator(self.ITEM_RATE_INPUT).nth(index).fill(rate)
    
    def get_item_amount(self, index: int) -> str:
        """Get item amount at given index (auto-calculated)"""
        return self.page.locator(self.ITEM_AMOUNT_FIELD).nth(index).input_value()
    
    def click_remove_item(self, index: int):
        """Remove item at given index"""
        self.page.locator(self.REMOVE_ITEM_BUTTON).nth(index).click()
    
    def get_item_count(self) -> int:
        """Get number of items in the table"""
        return self.page.locator(self.ITEM_DESCRIPTION_INPUT).count()
    
    # Form submission
    def click_submit(self):
        """Click Submit to ERPNext button"""
        self.click(self.SUBMIT_BUTTON)
    
    def click_cancel(self):
        """Click Cancel button"""
        self.click(self.CANCEL_BUTTON)
    
    def is_submitting(self) -> bool:
        """Check if form is currently submitting"""
        return self.is_visible(self.LOADING_SPINNER)
    
    # Status and messages
    def has_success_message(self) -> bool:
        """Check if success message is visible"""
        return self.is_visible(self.SUCCESS_MESSAGE)
    
    def has_error_message(self) -> bool:
        """Check if error message is visible"""
        return self.is_visible(self.ERROR_MESSAGE)
    
    def has_warning_message(self) -> bool:
        """Check if warning message is visible"""
        return self.is_visible(self.WARNING_MESSAGE)
    
    def get_success_text(self) -> str:
        """Get success message text"""
        return self.get_text(self.SUCCESS_MESSAGE)
    
    def get_error_text(self) -> str:
        """Get error message text"""
        return self.get_text(self.ERROR_MESSAGE)
    
    def get_warning_text(self) -> str:
        """Get warning message text"""
        return self.get_text(self.WARNING_MESSAGE)
    
    def get_erpnext_invoice_number(self) -> str:
        """Get ERPNext invoice number from success message"""
        return self.page.locator(self.SUCCESS_MESSAGE).locator(self.ERPNEXT_INVOICE_NUMBER).text_content()
    
    def get_status_messages(self) -> list:
        """Get all status messages"""
        messages = []
        if self.is_visible(self.STATUS_MESSAGES):
            elements = self.page.locator(f'{self.STATUS_MESSAGES} p').all()
            messages = [el.text_content() for el in elements]
        return messages
