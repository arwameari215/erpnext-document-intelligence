"""
Base Page Object
Contains common functionality for all page objects
"""
from playwright.sync_api import Page, expect


class BasePage:
    """
    Base class for all Page Objects
    Contains common selectors and actions
    NO ASSERTIONS - those belong in test files
    """
    
    def __init__(self, page: Page):
        self.page = page
    
    def navigate_to(self, url: str):
        """Navigate to a URL"""
        self.page.goto(url)
    
    def click(self, selector: str):
        """Click an element"""
        self.page.click(selector)
    
    def fill(self, selector: str, value: str):
        """Fill an input field"""
        self.page.fill(selector, value)
    
    def select_option(self, selector: str, value: str):
        """Select an option from dropdown"""
        self.page.select_option(selector, value)
    
    def get_text(self, selector: str) -> str:
        """Get text content of an element"""
        return self.page.locator(selector).text_content()
    
    def is_visible(self, selector: str) -> bool:
        """Check if element is visible"""
        return self.page.locator(selector).is_visible()
    
    def wait_for_selector(self, selector: str, timeout: int = 30000):
        """Wait for element to appear"""
        self.page.wait_for_selector(selector, timeout=timeout)
    
    def wait_for_url(self, url: str, timeout: int = 30000):
        """Wait for URL to match pattern"""
        self.page.wait_for_url(url, timeout=timeout)
