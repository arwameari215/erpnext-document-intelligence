# UI E2E Test Plan

## ERPNext Document Intelligence Application

**Version:** 1.0  
**Date:** February 2026  
**Author:** QA Team

---

## 1. Introduction

### 1.1 Purpose
This document outlines the end-to-end (E2E) test plan for the ERPNext Document Intelligence application. The application allows users to upload PDF documents (invoices and purchase orders), extract data using AI, and submit the processed data to ERPNext.

### 1.2 Scope
- UI automation testing using Playwright
- Integration with real backend API
- Invoice and Purchase Order workflows
- Form validation and error handling

### 1.3 Test Environment

| Component | URL |
|-----------|-----|
| Frontend (Local) | http://localhost:3000 |
| Backend (Local) | http://localhost:8000 |
| Backend (CI/ngrok) | https://foggiest-braiden-nonadvantageously.ngrok-free.dev |

---

## 2. Test Architecture

### 2.1 Framework Stack
- **Language:** Python 3.11+
- **Test Framework:** unittest
- **Browser Automation:** Playwright
- **Design Pattern:** Page Object Model (POM)

### 2.2 Project Structure
```
tests/
├── __init__.py
├── requirements.txt
└── ui/
    ├── __init__.py
    ├── base_test.py              # Base test class with browser setup
    ├── conftest.py               # Configuration
    ├── test_invoice_flow.py      # Invoice test cases
    ├── test_po_flow.py           # Purchase Order test cases
    ├── fixtures/
    │   ├── sample_invoice.pdf    # Test invoice PDF
    │   ├── sample_po.pdf         # Test PO PDF
    │   └── invalid.txt           # Invalid file for negative tests
    └── pages/
        ├── __init__.py
        ├── upload_invoice_page.py
        ├── upload_po_page.py
        ├── invoice_form_page.py
        └── po_form_page.py
```

---

## 3. Test Cases

### 3.1 Invoice Flow Tests

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| INV-001 | test_invoice_happy_flow | Upload PDF → Verify form filled → Submit successfully | High |
| INV-002 | test_invoice_wrong_file_type | Upload non-PDF file → Verify error message | Medium |
| INV-003 | test_invoice_missing_required_fields | Clear required fields → Submit → Verify validation error | Medium |
| INV-004 | test_invoice_invalid_values | Enter invalid values → Submit → Verify validation error | Medium |

### 3.2 Purchase Order Flow Tests

| Test ID | Test Name | Description | Priority |
|---------|-----------|-------------|----------|
| PO-001 | test_po_happy_flow | Upload PDF → Verify form filled → Submit successfully | High |
| PO-002 | test_po_wrong_file_type | Upload non-PDF file → Verify error message | Medium |
| PO-003 | test_po_missing_required_fields | Clear required fields → Submit → Verify validation error | Medium |
| PO-004 | test_po_invalid_values | Enter invalid values → Submit → Verify validation error | Medium |

---

## 4. Detailed Test Scenarios

### 4.1 INV-001: Invoice Happy Flow

**Objective:** Verify complete invoice processing workflow

**Preconditions:**
- Frontend running at localhost:3000
- Backend running at localhost:8000
- Valid sample_invoice.pdf in fixtures

**Test Steps:**
1. Navigate to invoice upload page (/)
2. Upload sample_invoice.pdf
3. Wait for API to process document (up to 60s)
4. Verify "Invoice Preview" form is displayed
5. Verify form fields are populated with extracted data:
   - Shipping Address
   - Subtotal
   - Shipping Cost
   - Tax
   - Invoice Total
   - Line Items table
6. Click "Create Sales Invoice" button
7. Verify success message is displayed

**Expected Result:** Invoice created successfully with data from PDF

---

### 4.2 INV-002: Invoice Wrong File Type

**Objective:** Verify system rejects non-PDF files

**Test Steps:**
1. Navigate to invoice upload page
2. Upload invalid.txt file
3. Verify error message is displayed

**Expected Result:** Error message indicating only PDF files are accepted

---

### 4.3 INV-003: Invoice Missing Required Fields

**Objective:** Verify form validation for required fields

**Test Steps:**
1. Navigate to invoice upload page
2. Upload valid PDF
3. Wait for form to populate
4. Clear the "Invoice Total" field
5. Click submit button
6. Verify validation error message

**Expected Result:** Validation error for missing required field

---

### 4.4 INV-004: Invoice Invalid Values

**Objective:** Verify form validation for invalid data

**Test Steps:**
1. Navigate to invoice upload page
2. Upload valid PDF
3. Wait for form to populate
4. Enter "abc" in Invoice Total field (expecting number)
5. Click submit button
6. Verify validation error message

**Expected Result:** Validation error for invalid numeric value

---

### 4.5 PO-001: Purchase Order Happy Flow

**Objective:** Verify complete PO processing workflow

**Preconditions:**
- Valid sample_po.pdf in fixtures

**Test Steps:**
1. Navigate to PO upload page (/purchase-order)
2. Upload sample_po.pdf
3. Wait for API to process document (up to 60s)
4. Verify "Purchase Order Form" is displayed
5. Verify form fields are populated:
   - Supplier Name
   - Delivery Date
   - Line Items
6. If Delivery Date is empty, fill with future date
7. Click "Create Purchase Order" button
8. Verify success message

**Expected Result:** Purchase Order created successfully

---

### 4.6 PO-002: PO Wrong File Type

**Objective:** Verify system rejects non-PDF files for PO

**Test Steps:**
1. Navigate to PO upload page
2. Upload invalid.txt file
3. Verify error message

**Expected Result:** Error message for invalid file type

---

### 4.7 PO-003: PO Missing Required Fields

**Objective:** Verify PO form validation

**Test Steps:**
1. Upload valid PO PDF
2. Clear supplier name field
3. Submit form
4. Verify validation error

**Expected Result:** Validation error for missing supplier

---

### 4.8 PO-004: PO Invalid Values

**Objective:** Verify PO form rejects invalid data

**Test Steps:**
1. Upload valid PO PDF
2. Enter invalid date format
3. Submit form
4. Verify validation error

**Expected Result:** Validation error for invalid date

---

## 5. Test Data

### 5.1 Test Files

| File | Purpose | Location |
|------|---------|----------|
| sample_invoice.pdf | Valid invoice for happy path | tests/ui/fixtures/ |
| sample_po.pdf | Valid PO for happy path | tests/ui/fixtures/ |
| invalid.txt | Invalid file type testing | tests/ui/fixtures/ |

### 5.2 Expected Form Fields

**Invoice Form:**
- Shipping Address (text)
- Subtotal (number)
- Shipping Cost (number)
- Tax (number)
- Invoice Total (number, required)
- Line Items (table)

**PO Form:**
- Supplier Name (text, required)
- Delivery Date (date, required)
- Line Items (table)

---

## 6. Execution

### 6.1 Local Execution

```bash
# Activate virtual environment
source .venv/Scripts/activate  # Windows
source .venv/bin/activate      # Linux/Mac

# Run all tests
python -m unittest discover -s tests.ui -p "test_*.py" -v

# Run invoice tests only
python -m unittest tests.ui.test_invoice_flow -v

# Run PO tests only
python -m unittest tests.ui.test_po_flow -v

# Run specific test
python -m unittest tests.ui.test_invoice_flow.TestInvoiceFlow.test_invoice_happy_flow -v

# Run with visible browser (non-headless)
HEADLESS=false python -m unittest tests.ui.test_invoice_flow -v
```

### 6.2 CI Execution (GitHub Actions)

Tests run automatically on:
- Push to `main`, `develop`, or `Tests` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**CI Configuration:** `.github/workflows/test-ui.yml`

---

## 7. Configuration

### 7.1 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| BASE_URL | http://localhost:3000 | Frontend URL |
| BACKEND_URL | http://localhost:8000 | Backend API URL |
| HEADLESS | true | Run browser in headless mode |
| BROWSERS | chromium | Browsers to test (chromium, firefox, webkit) |

### 7.2 Timeouts

| Timeout | Value | Purpose |
|---------|-------|---------|
| API_TIMEOUT | 60000ms | Wait for backend API responses |
| FORM_TIMEOUT | 30000ms | Wait for form to be populated |

---

## 8. Reporting

### 8.1 Test Output
- Console output with test results
- Pass/Fail status for each test
- Error messages and stack traces on failure

### 8.2 CI Artifacts
- Screenshots on failure (if configured)
- Test traces for debugging

---

## 9. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Backend unavailable | Tests fail | Ensure backend is running before tests |
| Ngrok tunnel expires | CI fails | Monitor ngrok status, restart if needed |
| PDF extraction varies | Flaky tests | Use consistent test PDFs |
| Network latency | Timeouts | Generous timeout values (60s for API) |

---

## 10. Acceptance Criteria

- [ ] All 8 tests pass locally
- [ ] All 8 tests pass in CI
- [ ] No flaky tests (3 consecutive runs pass)
- [ ] Test execution time < 2 minutes
- [ ] Clear error messages on failure

---

## 11. Test Results Summary

| Test Suite | Total | Pass | Fail | Skip |
|------------|-------|------|------|------|
| Invoice Flow | 4 | - | - | - |
| PO Flow | 4 | - | - | - |
| **Total** | **8** | - | - | - |

*Results to be updated after test execution*

---

## 12. Exit Criteria

The following criteria must be met before the testing phase is considered complete:

1. All test cases have been executed.
2. All critical and high-priority test cases have passed.
3. No open critical or high-priority defects remain.
4. All medium-priority defects have been addressed or deferred with proper approval.
5. Test coverage meets or exceeds the defined threshold.
6. Test results and reports have been reviewed and approved by the QA team and stakeholders.
7. All test artifacts, including test cases, results, and logs, have been documented and archived.

---

## Appendix A: Page Object Model

### Upload Invoice Page
- `navigate()` - Go to upload page
- `upload_pdf(file_path)` - Upload PDF file
- `get_error_message()` - Get error text if present

### Invoice Form Page
- `wait_for_form()` - Wait for form to load
- `get_field_value(field_name)` - Get input value
- `set_field_value(field_name, value)` - Set input value
- `submit_form()` - Click submit button
- `get_success_message()` - Get success text
- `get_validation_error()` - Get validation error

### Similar methods for PO pages

---

## Appendix B: Commands Quick Reference

```bash
# Install dependencies
pip install -r tests/requirements.txt
playwright install chromium

# Run all tests
python -m unittest discover -s tests.ui -p "test_*.py" -v

# Run with browser visible
HEADLESS=false python -m unittest discover -s tests.ui -p "test_*.py" -v

# Clear cache before running
find tests -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null
```
