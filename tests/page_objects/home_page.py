"""
Home Page Object
Represents the landing page with document type selection
"""
from playwright.sync_api import Page
from .base_page import BasePage


class HomePage(BasePage):
    """
    Home Page - Document type selection
    Contains ONLY selectors and actions, NO assertions
    """
    
    # Selectors
    DOCUMENT_TYPE_SELECT = 'select#documentType'
    FILE_INPUT = 'input[type="file"]'
    UPLOAD_BUTTON = 'button:has-text("Upload")'
    PROCESSING_INDICATOR = 'text=Processing'
    
    def __init__(self, page: Page, base_url: str):
        super().__init__(page)
        self.base_url = base_url
    
    def navigate(self):
        """Navigate to home page"""
        self.navigate_to(self.base_url)
    
    def select_invoice_tab(self):
        """Select Invoice from dropdown"""
        self.page.select_option(self.DOCUMENT_TYPE_SELECT, 'invoice')
    
    def select_purchase_order_tab(self):
        """Select Purchase Order from dropdown"""
        self.page.select_option(self.DOCUMENT_TYPE_SELECT, 'po')
    
    def upload_file(self, file_path: str):
        """Upload a file"""
        self.page.set_input_files(self.FILE_INPUT, file_path)
    
    def click_upload(self):
        """Click upload button"""
        self.click(self.UPLOAD_BUTTON)
    
    def is_processing(self) -> bool:
        """Check if document is being processed"""
        return self.is_visible(self.PROCESSING_INDICATOR)
