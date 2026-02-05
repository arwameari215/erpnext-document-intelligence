"""Page Objects package for UI tests."""

from tests.ui.pages.upload_invoice_page import UploadInvoicePage
from tests.ui.pages.upload_po_page import UploadPOPage
from tests.ui.pages.invoice_form_page import InvoiceFormPage
from tests.ui.pages.po_form_page import POFormPage

__all__ = [
    "UploadInvoicePage",
    "UploadPOPage",
    "InvoiceFormPage",
    "POFormPage",
]
