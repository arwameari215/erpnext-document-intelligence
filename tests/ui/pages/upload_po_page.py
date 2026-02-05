"""Page Object for Purchase Order Upload functionality.

Uses real backend API at localhost:8000 - no mocking.
"""

from playwright.sync_api import Page, expect


class UploadPOPage:
    """Page Object for the PO upload section of the application."""

    # Longer timeout for real API calls
    API_TIMEOUT = 60000  # 60 seconds

    def __init__(self, page: Page) -> None:
        """Initialize the upload PO page object."""
        self.page = page
        self.document_type_select = page.locator("#documentType")
        self.file_input = page.locator("#fileUpload")
        self.upload_button = page.locator("button:has-text('Upload & Process')")
        self.error_message = page.locator("div.bg-red-50 p")
        # Loading indicator to know when API call is in progress
        self.loading_indicator = page.locator("text=Processing").or_(page.locator("text=Uploading"))

    def go_to_page(self, url: str) -> None:
        """Navigate to the upload page and wait for it to load."""
        self.page.goto(url, wait_until="networkidle", timeout=30000)
        self.document_type_select.wait_for(state="visible", timeout=10000)

    def upload_pdf(self, file_path: str) -> None:
        """Select PO type, upload a PDF, click upload button, and wait for API response."""
        # Select document type
        self.document_type_select.select_option("po")
        # Wait for file input to be ready
        self.file_input.wait_for(state="attached", timeout=5000)
        # Set the file
        self.file_input.set_input_files(file_path)
        # Wait for upload button to be enabled and click
        expect(self.upload_button).to_be_enabled(timeout=5000)
        self.upload_button.click()
        
        # Wait for real API response - the form should appear when done
        # Wait for the PO Form header to appear
        self.page.wait_for_selector(
            "text=Purchase Order Form",
            timeout=self.API_TIMEOUT
        )

    def upload_invalid_file(self, file_path: str) -> None:
        """Upload an invalid file type to trigger validation error."""
        self.document_type_select.select_option("po")
        self.file_input.wait_for(state="attached", timeout=5000)
        self.file_input.set_input_files(file_path)

    def get_upload_error_text(self) -> str:
        """Get the error message text displayed on the upload page."""
        self.error_message.wait_for(state="visible", timeout=5000)
        return self.error_message.first.inner_text()
