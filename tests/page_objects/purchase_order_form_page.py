"""
Purchase Order Form Page Object
Represents the Purchase Order form with all fields and actions
"""
from playwright.sync_api import Page
from .base_page import BasePage


class PurchaseOrderFormPage(BasePage):
    """
    Purchase Order Form Page
    Contains ONLY selectors and actions, NO assertions
    """
    
    # Field Selectors
    SUPPLIER_NAME_INPUT = 'input[placeholder="Enter supplier name"]'
    COMPANY_NAME_INPUT = 'input[placeholder="Enter company name"]'
    CURRENCY_SELECT = 'select'  # Currency is a select dropdown, not readonly field
    
    # Item table selectors - based on actual PO form structure
    ADD_ITEM_BUTTON = 'button:has-text("Add Item")'
    ITEM_CODE_INPUT = 'input[placeholder="ITEM-001"]'
    ITEM_DESCRIPTION_INPUT = 'input[placeholder="Item description"]'
    ITEM_QUANTITY_INPUT = 'input[type="number"][step="0.01"]'
    ITEM_UNIT_PRICE_INPUT = 'input[type="number"][step="0.01"]'
    ITEM_TOTAL_TEXT = 'span.font-semibold'
    REMOVE_ITEM_BUTTON = 'button[title="Remove item"]'
    
    # Action buttons
    SUBMIT_BUTTON = 'button:has-text("Submit to ERPNext")'
    CANCEL_BUTTON = 'button:has-text("Cancel")'
    
    # Status and message selectors
    SUCCESS_MESSAGE = 'div.bg-green-50'
    ERROR_MESSAGE = 'div.bg-red-50'
    WARNING_MESSAGE = 'div.bg-orange-50'
    STATUS_MESSAGES = 'div.bg-blue-50'
    LOADING_SPINNER = 'svg.animate-spin'
    
    def __init__(self, page: Page):
        super().__init__(page)
    
    # Form field actions
    def fill_supplier_name(self, name: str):
        """Fill supplier name"""
        self.fill(self.SUPPLIER_NAME_INPUT, name)
    
    def fill_company_name(self, name: str):
        """Fill company name"""
        self.fill(self.COMPANY_NAME_INPUT, name)
    
    def get_currency(self) -> str:
        """Get the selected currency value"""
        # For select elements, use evaluate to get selected value
        select_elem = self.page.locator(self.CURRENCY_SELECT).first
        return select_elem.evaluate('el => el.value')
    
    def fill_order_date(self, date: str):
        """Fill order date (YYYY-MM-DD format)"""
        # Order date is the first date input
        self.page.locator('input[type="date"]').first.fill(date)
    
    def fill_delivery_date(self, date: str):
        """Fill delivery date (YYYY-MM-DD format)"""
        # Delivery date is the second date input
        self.page.locator('input[type="date"]').nth(1).fill(date)
    
    # Item management actions
    def click_add_item(self):
        """Click the Add Item button"""
        self.click(self.ADD_ITEM_BUTTON)
    
    def fill_item_code(self, index: int, code: str):
        """Fill item code for the item at given index"""
        self.page.locator(self.ITEM_CODE_INPUT).nth(index).fill(code)
    
    def fill_item_description(self, index: int, description: str):
        """Fill item description for the item at given index"""
        self.page.locator(self.ITEM_DESCRIPTION_INPUT).nth(index).fill(description)
    
    def fill_item_quantity(self, index: int, quantity: str):
        """Fill item quantity for the item at given index"""
        # Find all number inputs in tbody - quantity is first number per row
        all_number_inputs = self.page.locator('tbody input[type="number"]').all()
        all_number_inputs[index * 2].fill(quantity)
    
    def fill_item_unit_price(self, index: int, price: str):
        """Fill item unit price for the item at given index"""
        # Unit price is the second number input per row
        all_number_inputs = self.page.locator('tbody input[type="number"]').all()
        all_number_inputs[index * 2 + 1].fill(price)
    
    def get_item_total(self, index: int) -> str:
        """Get the total amount for the item at given index"""
        # Total is displayed as span with font-semibold class
        return self.page.locator('span.font-semibold').nth(index).text_content()
    
    def click_remove_item(self, index: int):
        """Click remove button for the item at given index"""
        self.page.locator(self.REMOVE_ITEM_BUTTON).nth(index).click()
    
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
    
    def get_status_messages(self) -> list:
        """Get all status messages"""
        messages = []
        if self.is_visible(self.STATUS_MESSAGES):
            elements = self.page.locator(f'{self.STATUS_MESSAGES} p').all()
            messages = [el.text_content() for el in elements]
        return messages
