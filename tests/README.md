# ERPNext Document Intelligence - Test Suite

## 📋 Overview

This test suite follows a **methodological QA approach** with clear separation between:
- **Mocked CI-safe tests** (run in GitHub Actions)
- **Local integration tests** (require real ERPNext/APIs)

## 🧪 Test Architecture

### Page Object Model (POM)
All tests use the Page Object Model pattern:
- **Page Objects** (`tests/page_objects/`): Contain selectors and actions ONLY
- **Test Files** (`tests/test_*.py`): Contain assertions and test logic ONLY
- **NO duplication** of UI logic in tests
- **Clear separation** of concerns

### Two Types of Tests

#### 1️⃣ Mocked Tests (CI-Safe)
**File**: `tests/test_invoice_mocked.py`

**Purpose**:
- Validate UI behavior without external dependencies
- Test form validation
- Test happy path submission flow
- Test error handling

**Characteristics**:
- ✅ Run in GitHub Actions
- ✅ Mock ERPNext and PDF APIs using Playwright network interception
- ✅ Fast and deterministic
- ✅ No external service dependencies

**What's Mocked**:
- Company existence/creation
- Customer existence/creation
- Item existence/creation
- Sales Invoice creation
- Sales Invoice submission

#### 2️⃣ Integration Tests (Local Only)
**File**: `tests/test_invoice_integration.py`

**Purpose**:
- Verify real integration with ERPNext
- Test actual API communication
- Validate complete data flow

**Characteristics**:
- ❌ **NOT for CI** - require real services
- ✅ Automatically skip if APIs unavailable
- ✅ Ping APIs before running (health checks)
- ✅ Run locally only

**Prerequisites**:
- ERPNext running at `localhost:8080`
- UI running at `localhost:3000`
- Valid API credentials configured

## 🌐 Multi-Browser Testing

All tests run on:
- ✅ **Chromium** (Chrome)
- ✅ **Firefox**
- ✅ **WebKit** (Safari)

Tests use the same logic across browsers and fail per-browser if issues arise.

## 🚀 Running Tests

### Prerequisites

1. **Install test dependencies**:
```bash
cd tests
pip install -r requirements.txt
playwright install
```

2. **Install Playwright browsers**:
```bash
playwright install chromium firefox webkit
```

### Run Mocked Tests (CI-Safe)

```bash
# Run all mocked tests
python -m unittest tests.test_invoice_mocked -v

# Run specific test
python -m unittest tests.test_invoice_mocked.MockedInvoiceTests.test_end_to_end_invoice_submission_happy_path -v
```

**When to run**: Anytime - no external services needed

### Run Integration Tests (Local Only)

```bash
# Ensure services are running:
# 1. Start ERPNext at localhost:8080
# 2. Start UI at localhost:3000

# Run integration tests
python -m unittest tests.test_invoice_integration -v
```

**When to run**: Only when ERPNext and UI are running locally

### Run All Tests

```bash
# Run all tests (mocked + integration)
# Integration tests auto-skip if services unavailable
python -m unittest discover tests -v
```

## 📊 Test Coverage

### Mocked Tests Cover:
✅ Form validation (empty fields, invalid data)  
✅ Currency field behavior (read-only, fetched from company)  
✅ Dynamic calculations (subtotal, total)  
✅ Item management (add, remove, calculations)  
✅ **Complete E2E happy path** (fill form → submit → success)  

### Integration Tests Cover:
✅ Real ERPNext invoice creation  
✅ Real company currency fetch  
✅ API error handling (currency mismatch, etc.)  
✅ Multi-step ERPNext workflow (company → customer → items → invoice)  

## 🎯 CI/CD Pipeline

### GitHub Actions Workflow
**File**: `.github/workflows/test-ui.yml`

**What it does**:
1. Sets up Node.js and Python
2. Installs UI and test dependencies
3. Builds UI application
4. Starts UI server in preview mode
5. Runs mocked tests on all browsers
6. Uploads test results as artifacts

**What it DOES NOT do**:
❌ Start ERPNext  
❌ Depend on external services  
❌ Run integration tests  

## 📁 Directory Structure

```
tests/
├── __init__.py
├── requirements.txt           # Test dependencies
├── config.py                  # Test configuration
├── test_invoice_mocked.py     # CI-safe mocked tests
├── test_invoice_integration.py # Local integration tests
├── page_objects/              # Page Object Model
│   ├── __init__.py
│   ├── base_page.py          # Base page class
│   ├── home_page.py          # Home page with upload
│   └── invoice_form_page.py  # Invoice form page
└── utils/                     # Test utilities
    ├── __init__.py
    └── api_checker.py         # API availability checker
```

## 🔍 Key Methodologies Applied

### 1. **API Availability Checks**
Before running integration tests, we ping APIs:
```python
from utils.api_checker import check_erpnext_availability

available, message = check_erpnext_availability(ERPNEXT_BASE_URL)
if not available:
    raise unittest.SkipTest(f"ERPNext not available: {message}")
```

### 2. **Network Mocking**
Mocked tests intercept network requests:
```python
page.route('**/api/resource/Sales%20Invoice', handle_invoice_create)
```

### 3. **Browser-Agnostic Testing**
Same test logic runs on all browsers:
```python
def _run_test_on_all_browsers(self, test_func):
    for browser_name, page in self.pages.items():
        test_func(page)  # Same test, different browser
```

### 4. **Clear Test Separation**
```python
# Mocked test - always runs
class MockedInvoiceTests(unittest.TestCase):
    pass

# Integration test - only if APIs available
class LocalIntegrationInvoiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not erpnext_available:
            raise unittest.SkipTest("ERPNext not available")
```

## ⚠️ Important Notes

### For CI/CD:
- Only `test_invoice_mocked.py` runs in GitHub Actions
- Integration tests are automatically skipped in CI
- CI must NOT depend on ERPNext or external services

### For Local Development:
- Run integration tests to verify real ERPNext communication
- Ensure ERPNext and UI are running before integration tests
- Integration tests will gracefully skip if services unavailable

### Test Philosophy:
- **One comprehensive E2E journey** (not exhaustive coverage)
- **Focus on confidence**, not test volume
- **Deterministic** tests (no flaky tests)
- **Maintainable** code (POM pattern)

## 🐛 Debugging Tests

### Headed Mode (See Browser)
```python
# In test file, modify setUp:
browser.launch(headless=False)
```

### Slow Motion
```python
browser.launch(slow_mo=500)  # 500ms delay between actions
```

### Screenshots on Failure
```python
def tearDown(self):
    if self._outcome.errors:
        self.page.screenshot(path=f"failure_{self._testMethodName}.png")
```

### View Test Artifacts in CI
After CI run, download artifacts from GitHub Actions:
- Test results
- Screenshots (if configured)
- Logs

## ✅ Definition of Done

- [x] Mocked tests pass in GitHub Actions
- [x] No ERPNext dependency in CI
- [x] Local tests ping APIs before running
- [x] Tests run on Chrome, Firefox, and WebKit
- [x] Page Object Model implemented
- [x] One clear E2E journey validated
- [x] Clear separation: CI vs Local tests
- [x] Automatic skip when services unavailable

## 📞 Support

For questions about:
- **Test architecture**: Review this README
- **CI failures**: Check `.github/workflows/test-ui.yml`
- **Local test setup**: Ensure ERPNext/UI are running
- **Adding new tests**: Follow POM pattern in existing tests
