# ERPNext Document Intelligence

A complete document processing system for ERPNext with intelligent PDF extraction and automated document creation.

## Overview

This application consists of two main components:
- **Frontend (React + Vite)**: Modern UI for uploading PDFs and managing document data
- **Backend (Python + FastAPI)**: PDF parsing, data extraction, and ERPNext integration

## Features

### Document Processing
- **PDF Upload & Parsing**: Extract data from Purchase Order and Invoice PDFs
- **AI-Powered Extraction**: Claude API for intelligent field recognition
- **Editable Forms**: Review and modify extracted data before submission
- **Validation**: Client and server-side validation for data integrity

### ERPNext Integration
- **Automated Workflows**: Complete document creation from PDF to submitted ERPNext document
- **Entity Management**: Automatic creation of Company, Supplier, Customer, and Items
- **Multi-Currency Support**: Handle multiple currencies with exchange rate validation
- **Real-time Status**: Live feedback during ERPNext submission process
- **Document Submission**: Direct submission to ERPNext with proper docstatus

### Architecture
- **Secure**: API credentials stored server-side only
- **Scalable**: Backend API handles all business logic
- **Modern**: React frontend with Tailwind CSS styling
- **RESTful**: Clean API design with proper error handling

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Axios for HTTP requests

### Backend
- Python 3.10+
- FastAPI
- Anthropic Claude API
- ERPNext REST API integration

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.10+
- ERPNext instance running (default: http://localhost:8080)
- Claude API key for PDF extraction

### 1. Clone Repository

```bash
git clone <repository-url>
cd erpnext-document-intelligence
```

### 2. Frontend Setup

```bash
# Install dependencies
npm install
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
# - ANTHROPIC_API_KEY (Claude API)
# - ERPNEXT_URL (default: http://localhost:8080)
# - ERPNEXT_API_KEY
# - ERPNEXT_API_SECRET
```

### 4. ERPNext API Credentials

1. Login to your ERPNext instance (http://localhost:8080)
2. Go to: User Menu → My Settings → API Access
3. Click "Generate Keys"
4. Copy the API Key and API Secret
5. Add them to backend `.env` file:
   ```env
   ERPNEXT_API_KEY=your_generated_api_key
   ERPNEXT_API_SECRET=your_generated_api_secret
   ```

### 5. Start Services

**Terminal 1 - Backend API:**
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Backend will start at: http://localhost:8000
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Frontend will start at: http://localhost:3000

### 6. Test Connection

```bash
npm run test:erpnext
```

This verifies backend is running and connected to ERPNext.

## How It Works

### System Architecture

```
┌─────────────────┐
│  User Browser   │
│  (Port 3000)    │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  React Frontend │
│  - Upload UI    │
│  - Form Editor  │
│  - Validation   │
└────────┬────────┘
         │ REST API (/upload, /erpnext)
         ↓
┌─────────────────┐
│  FastAPI Backend│
│  (Port 8000)    │
│  - PDF Parsing  │
│  - Claude AI    │
│  - ERPNext API  │
└────────┬────────┘
         │ REST API
         ├──────────────┬──────────────┐
         ↓              ↓              ↓
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│ Claude API   │ │ ERPNext API │ │ File Storage │
│ (Text Extr.) │ │ (Port 8080) │ │ (temp files) │
└──────────────┘ └─────────────┘ └──────────────┘
```

### Request Flow

#### Purchase Order Submission:

1. **Upload Phase**
   ```
   User uploads PDF → Frontend → POST /upload/po → Backend
   Backend extracts data using Claude API
   Backend returns structured JSON with PO fields
   Frontend displays editable form
   ```

2. **Submission Phase**
   ```
   User clicks "Submit to ERPNext" → Frontend → POST /erpnext/purchase-order → Backend
   
   Backend workflow:
   ├─ Validate all required fields
   ├─ Check/Create Company in ERPNext
   ├─ Check/Create Supplier in ERPNext
   ├─ Check/Create all Items in ERPNext
   ├─ Create Purchase Order (draft)
   ├─ Submit Purchase Order (docstatus=1)
   └─ Return PO number to Frontend
   
   Frontend displays success message with ERPNext link
   ```

#### Sales Invoice Submission:

1. **Upload Phase**
   ```
   User uploads PDF → Frontend → POST /upload/invoice → Backend
   Backend extracts data using Claude API
   Backend returns structured JSON with invoice fields
   Frontend fetches company details via GET /erpnext/company/{name}
   Frontend displays editable form
   ```

2. **Submission Phase**
   ```
   User clicks "Submit to ERPNext" → Frontend → POST /erpnext/sales-invoice → Backend
   
   Backend workflow:
   ├─ Validate all required fields (dates, amounts, etc.)
   ├─ Check/Create Company in ERPNext
   ├─ Check/Create Customer in ERPNext
   ├─ Check/Create all Items in ERPNext
   ├─ Create Sales Invoice with shipping (draft)
   ├─ Submit Sales Invoice (docstatus=1)
   └─ Return Invoice number to Frontend
   
   Frontend displays success message
   ```

## Usage Guide

### Processing Purchase Orders

1. **Select Document Type**
   - Choose "Purchase Order" from the dropdown

2. **Upload PDF**
   - Click "Choose File" and select your PO PDF
   - Click "Upload & Process"
   - Backend extracts data using Claude AI

3. **Review Extracted Data**
   - Supplier Name
   - Company Name
   - Order Date & Delivery Date
   - Currency
   - Line Items (Item Code, Description, Quantity, Price)

4. **Edit as Needed**
   - Modify any fields
   - Add/remove line items using the table controls
   - Update quantities or prices

5. **Submit to ERPNext**
   - Click "Submit to ERPNext"
   - Watch real-time status messages
   - Receive ERPNext PO number on success
   - Click link to view in ERPNext

### Processing Sales Invoices

1. **Select Document Type**
   - Choose "Sales Invoice" from the dropdown

2. **Upload PDF**
   - Click "Choose File" and select your invoice PDF
   - Click "Upload & Process"
   - Backend extracts data using Claude AI

3. **Review Extracted Data**
   - Invoice ID & Customer Name
   - Company Name (with auto-detection)
   - Invoice Date & Due Date
   - Currency & Shipping Cost
   - Line Items with amounts

4. **Edit as Needed**
   - Modify customer information
   - Update dates (Due Date must be ≥ Invoice Date)
   - Edit line items
   - Update shipping cost

5. **Submit to ERPNext**
   - Click "Submit to ERPNext"
   - Watch real-time status messages
   - Receive ERPNext Invoice number on success

### What Happens Behind the Scenes

**During Upload:**
- Frontend sends PDF to backend `/upload/po` or `/upload/invoice`
- Backend saves file temporarily
- Claude API extracts structured data from PDF text
- Backend returns JSON with all fields
- Frontend populates form
- Temporary file is deleted

**During Submission:**
- Frontend validates all required fields
- Frontend sends data to backend `/erpnext/purchase-order` or `/erpnext/sales-invoice`
- Backend performs "create-if-not-exists" workflow:
  1. Check Company exists → Create if not
  2. Check Supplier/Customer exists → Create if not
  3. Check each Item exists → Create if not
  4. Create document in draft mode (docstatus=0)
  5. Submit document (docstatus=1)
- Backend returns document number
- Frontend displays success with ERPNext link

## Configuration Details

### Frontend Configuration (Vite)

**Development Server:** Port 3000  
**Proxy Configuration:** `vite.config.js` routes API calls through Vite proxy to avoid CORS:

```javascript
// vite.config.js
server: {
  proxy: {
    '/upload': {
      target: 'http://localhost:8000',  // Backend API
      changeOrigin: true,
    },
    '/erpnext': {
      target: 'http://localhost:8000',  // Backend API
      changeOrigin: true,
    }
  }
}
```

**Why Relative URLs?**  
Services use `BACKEND_API_URL = ''` (empty string) to create relative URLs like `/upload/po` and `/erpnext/purchase-order`. Requests automatically go through Vite proxy in development.

**No Frontend Authentication:**  
All ERPNext credentials removed from frontend. No `.env.local` needed.

### Backend Configuration (FastAPI)

**Development Server:** Port 8000  
**Environment Variables:** Required in backend `.env` file:

```env
# ERPNext Configuration (Required)
ERPNEXT_BASE_URL=http://localhost:8080
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here

# Claude AI Configuration (Required)
ANTHROPIC_API_KEY=your_claude_api_key_here

# CORS Configuration (Optional)
ALLOWED_ORIGINS=http://localhost:3000

# Upload Configuration (Optional)
MAX_FILE_SIZE=10485760  # 10MB default
UPLOAD_DIR=./uploads    # Temporary storage
```

**How to Get ERPNext Credentials:**
1. Log into ERPNext as Administrator
2. Go to User doctype → Find your user
3. Click "API Access" → Generate Keys
4. Copy API Key and API Secret to backend `.env`

**Security Notes:**
- API Key/Secret never leave the backend
- Frontend makes authenticated requests via backend proxy
- CORS limited to `ALLOWED_ORIGINS` only

### Warehouse Configuration

Items require a warehouse. Backend automatically assigns based on company abbreviation:
- Company: "My Company" (abbr: "MC")
- Warehouse: "Stores - MC"

To customize, update backend warehouse logic.

## Validation Rules

### Purchase Order Validation
- **Supplier Name**: Required
- **Company Name**: Required  
- **Order Date**: Required
- **Delivery Date**: Required, must be ≥ order date and ≥ today
- **Currency**: Required
- **Items**: At least one required
  - Item Code: Required
  - Description: Required
  - Quantity: Must be > 0
  - Unit Price: Cannot be negative

### Sales Invoice Validation
- **Customer Name**: Required
- **Company Name**: Required
- **Invoice Date**: Required
- **Due Date**: Required, must be ≥ invoice date
- **Currency**: Required
- **Items**: At least one required
  - Item Code: Required
  - Description: Required
  - Quantity: Must be > 0
  - Amount: Cannot be negative

## Troubleshooting

### Frontend Issues

**Problem:** "Network error: Failed to fetch"  
**Solutions:**
1. Verify backend is running on port 8000
2. Check Vite dev server is running on port 3000
3. Ensure `vite.config.js` proxy configuration is correct
4. Check browser console for detailed error messages

**Problem:** CORS errors or OPTIONS 405  
**Solutions:**
1. Use relative URLs in services (not `http://localhost:8000`)
2. Verify Vite proxy routes `/upload` and `/erpnext` to backend
3. Restart Vite dev server: `npm run dev`

**Problem:** Form validation errors  
**Solutions:**
1. Check all required fields are filled
2. Verify dates are in correct format (YYYY-MM-DD)
3. Ensure quantities/prices are positive numbers
4. Check Due Date ≥ Invoice Date

### Backend Issues

**Problem:** "ERPNext API credentials not configured"  
**Solutions:**
1. Create backend `.env` file with credentials
2. Copy from `.env.example` template
3. Verify `ERPNEXT_API_KEY` and `ERPNEXT_API_SECRET` are set
4. Restart backend server

**Problem:** "Could not connect to ERPNext"  
**Solutions:**
1. Verify ERPNext is running: `curl http://localhost:8080/api/method/ping`
2. Check `ERPNEXT_BASE_URL` in backend `.env`
3. Test credentials: `node test-erpnext-connection.js`
4. Check ERPNext logs for API errors

**Problem:** "Claude API error"  
**Solutions:**
1. Verify `ANTHROPIC_API_KEY` in backend `.env`
2. Check API key is valid and has credits
3. Ensure PDF text extraction is working
4. Check backend logs for detailed error

### ERPNext Issues

**Problem:** "Exchange rate not configured"  
**Solutions:**
1. Go to ERPNext: Setup → Currency Exchange
2. Add exchange rate for your currency to company default currency
3. Set valid from/to dates

**Problem:** "Warehouse is mandatory for stock Item"  
**Solutions:**
1. Verify warehouse exists: "Stores - {company_abbr}"
2. Check item is marked as stock item
3. Update warehouse logic in backend if needed

**Problem:** "Company/Supplier/Customer not found"  
**Solutions:**
1. Backend creates entities automatically
2. Check ERPNext Chart of Accounts is set up
3. Verify default Price List exists
4. Check ERPNext logs for creation errors

**Problem:** "Permission denied"  
**Solutions:**
1. Verify API user has correct permissions
2. Check user roles include: Purchase Manager, Sales Manager, Stock User
3. Ensure API access is enabled for user

### Testing Connection

Run the test script to verify full connectivity:

```bash
node test-erpnext-connection.js
```

This tests: Frontend → Backend → ERPNext API chain.

Expected output:
```
Testing ERPNext connection via backend...
✓ Backend is responding
✓ Successfully connected to ERPNext!
ERPNext system ready.
```

## Project Structure

```
erpnext-document-intelligence/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── InvoiceForm.jsx           # Sales Invoice form UI
│   │   │   └── PurchaseOrderForm.jsx     # Purchase Order form UI
│   │   ├── services/
│   │   │   ├── erpnextService.js         # PO backend API client
│   │   │   └── erpnextSalesInvoiceService.js  # Invoice backend API client
│   │   ├── App.jsx                       # Main application component
│   │   ├── App.css                       # Application styles
│   │   ├── main.jsx                      # Entry point
│   │   └── index.css                     # Global styles with Tailwind
│   ├── index.html                        # HTML template
│   ├── vite.config.js                    # Vite config with proxy setup
│   ├── tailwind.config.js                # Tailwind CSS config
│   ├── postcss.config.js                 # PostCSS config
│   ├── package.json                      # Frontend dependencies
│   └── test-erpnext-connection.js        # Backend API test script
│
├── backend/                              # FastAPI backend (separate repo/folder)
│   ├── api_server.py                     # Main FastAPI server
│   ├── .env                              # Backend environment variables (not in git)
│   ├── .env.example                      # Backend .env template
│   ├── requirements.txt                  # Python dependencies
│   └── uploads/                          # Temporary PDF storage
│
├── tests/                                # E2E test suite
│   ├── test_invoice_integration.py       # Live ERPNext integration tests
│   ├── test_invoice_mocked.py            # Mocked API tests
│   ├── config.py                         # Test configuration
│   ├── requirements.txt                  # Test dependencies
│   ├── run_integration_tests.bat         # Windows integration test runner
│   ├── run_integration_tests.sh          # Unix integration test runner
│   ├── run_mocked_tests.bat              # Windows mocked test runner
│   ├── run_mocked_tests.sh               # Unix mocked test runner
│   ├── page_objects/                     # Page Object Model
│   │   ├── base_page.py                  # Base page class
│   │   ├── home_page.py                  # Home page object
│   │   └── invoice_form_page.py          # Invoice form page object
│   └── utils/
│       └── api_checker.py                # API validation utilities
│
├── docs/                                 # Documentation
│   ├── ERPNEXT_INTEGRATION_SPEC.md       # Complete API specification
│   ├── FRONTEND_REFACTORING_SUMMARY.md   # Refactoring documentation
│   └── CODE_CLEANUP_SUMMARY.md           # Cleanup history
│
└── readme.md                             # This file
```

### Key Files Explained

**Frontend Services:**
- `erpnextService.js`: Handles PO upload and submission to backend
- `erpnextSalesInvoiceService.js`: Handles invoice upload and submission to backend
- Both use relative URLs (`''`) to work with Vite proxy

**Configuration:**
- `vite.config.js`: Proxy `/upload` and `/erpnext` to backend (port 8000)
- Backend `.env`: Contains ERPNext and Claude API credentials
- No frontend `.env` needed (all authentication on backend)

**Testing:**
- `test-erpnext-connection.js`: Quick connectivity test
- `tests/`: Full E2E test suite with Selenium + page objects

## API Reference

### Backend API Endpoints

All endpoints require backend authentication (handled internally with ERPNext credentials).

#### Upload Endpoints

**POST `/upload/po`**  
Upload and extract Purchase Order data from PDF.

Request:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

fetch('/upload/po', {
  method: 'POST',
  body: formData
});
```

Response:
```json
{
  "supplier_name": "ABC Suppliers Ltd",
  "company": "My Company",
  "order_date": "2024-01-15",
  "delivery_date": "2024-02-15",
  "currency": "USD",
  "items": [
    {
      "item_code": "ITEM-001",
      "description": "Product Description",
      "quantity": 10,
      "uom": "Nos",
      "unit_price": 50.00
    }
  ]
}
```

**POST `/upload/invoice`**  
Upload and extract Sales Invoice data from PDF.

Request:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

fetch('/upload/invoice', {
  method: 'POST',
  body: formData
});
```

Response:
```json
{
  "invoice_id": "INV-2024-001",
  "customer_name": "Customer Corp",
  "company": "My Company",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "currency": "USD",
  "shipping_cost": 25.00,
  "items": [
    {
      "item_code": "ITEM-001",
      "description": "Product Description",
      "quantity": 5,
      "amount": 250.00
    }
  ]
}
```

#### Submission Endpoints

**POST `/erpnext/purchase-order`**  
Create and submit Purchase Order to ERPNext.

Request:
```json
{
  "supplier_name": "ABC Suppliers Ltd",
  "company": "My Company",
  "order_date": "2024-01-15",
  "delivery_date": "2024-02-15",
  "currency": "USD",
  "items": [
    {
      "item_code": "ITEM-001",
      "description": "Product Description",
      "quantity": 10,
      "uom": "Nos",
      "unit_price": 50.00
    }
  ]
}
```

Response (Success):
```json
{
  "message": "Purchase Order created successfully",
  "po_number": "PO-2024-00001",
  "po_url": "http://localhost:8080/app/purchase-order/PO-2024-00001"
}
```

Response (Error):
```json
{
  "detail": "Error message describing what went wrong"
}
```

**POST `/erpnext/sales-invoice`**  
Create and submit Sales Invoice to ERPNext.

Request:
```json
{
  "invoice_id": "INV-2024-001",
  "customer_name": "Customer Corp",
  "company": "My Company",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "currency": "USD",
  "shipping_cost": 25.00,
  "items": [
    {
      "item_code": "ITEM-001",
      "description": "Product Description",
      "quantity": 5,
      "amount": 250.00
    }
  ]
}
```

Response (Success):
```json
{
  "message": "Sales Invoice created successfully",
  "invoice_number": "SINV-2024-00001",
  "invoice_url": "http://localhost:8080/app/sales-invoice/SINV-2024-00001"
}
```

**GET `/erpnext/test-connection`**  
Test backend connectivity to ERPNext.

Response (Success):
```json
{
  "status": "success",
  "message": "Successfully connected to ERPNext",
  "erpnext_url": "http://localhost:8080"
}
```

### Backend Workflow (Automatic)

When you submit a Purchase Order or Sales Invoice, the backend automatically:

1. **Validates** all required fields
2. **Creates Company** if it doesn't exist
3. **Creates Supplier/Customer** if they don't exist
4. **Creates each Item** if it doesn't exist
5. **Creates Document** in draft mode (docstatus=0)
6. **Submits Document** (docstatus=1)
7. **Returns** document number and URL

All entity creation is idempotent - existing entities are not duplicated.

## Security & Production Notes

### Current Architecture (Development)
- **Secure:** All ERPNext credentials stored on backend only
- **CORS Handled:** Vite proxy eliminates CORS issues in development
- **No Credential Exposure:** Frontend has zero access to API keys/secrets

### Production Deployment Checklist

**Backend:**
- [ ] Use environment variables (never commit `.env`)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure `ALLOWED_ORIGINS` to your frontend domain only
- [ ] Add rate limiting to prevent abuse
- [ ] Implement request logging and monitoring
- [ ] Use secure file storage (not local disk)
- [ ] Set up proper error handling without leaking details

**Frontend:**
- [ ] Build with `npm run build`
- [ ] Serve static files via CDN or web server
- [ ] Update API URLs to production backend
- [ ] Remove Vite proxy (not needed in production)
- [ ] Enable CSP headers for XSS protection
- [ ] Minify and compress assets

**ERPNext:**
- [ ] Use dedicated API user with minimal permissions
- [ ] Rotate API keys regularly
- [ ] Enable API rate limiting in ERPNext
- [ ] Monitor API usage for anomalies
- [ ] Back up data regularly

## Testing

### Manual Testing

1. **Start Services:**
   ```bash
   # Terminal 1: Start ERPNext
   cd frappe-bench && bench start
   
   # Terminal 2: Start backend
   cd backend && python api_server.py
   
   # Terminal 3: Start frontend
   npm run dev
   ```

2. **Test Connection:**
   ```bash
   node test-erpnext-connection.js
   ```

3. **Test UI:**
   - Open http://localhost:3000
   - Upload sample PDF
   - Verify data extraction
   - Submit to ERPNext
   - Verify in ERPNext UI

### Automated Testing

**Integration Tests** (requires live ERPNext):
```bash
cd tests
run_integration_tests.bat    # Windows
./run_integration_tests.sh   # Unix/Mac
```

**Mocked Tests** (no ERPNext needed):
```bash
cd tests
run_mocked_tests.bat          # Windows
./run_mocked_tests.sh         # Unix/Mac
```

Tests use Selenium WebDriver with Page Object Model pattern.

## Available Scripts

### Frontend

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend

```bash
pip install -r requirements.txt    # Install Python dependencies
python api_server.py               # Start FastAPI server (port 8000)
```

### Testing

```bash
node test-erpnext-connection.js    # Test backend API connectivity
cd tests && run_integration_tests.bat    # Run E2E tests (Windows)
cd tests && ./run_integration_tests.sh   # Run E2E tests (Unix/Mac)
cd tests && run_mocked_tests.bat         # Run mocked tests (Windows)
cd tests && ./run_mocked_tests.sh        # Run mocked tests (Unix/Mac)
```

## Documentation

- **[ERPNEXT_INTEGRATION_SPEC.md](docs/ERPNEXT_INTEGRATION_SPEC.md)** - Complete API specification and workflow documentation
- **[FRONTEND_REFACTORING_SUMMARY.md](docs/FRONTEND_REFACTORING_SUMMARY.md)** - History of frontend refactoring from direct ERPNext to backend API
- **[CODE_CLEANUP_SUMMARY.md](docs/CODE_CLEANUP_SUMMARY.md)** - Documentation of code cleanup and legacy code removal

## Support & Troubleshooting

For issues:
1. Check browser console for frontend errors
2. Check backend terminal for FastAPI errors
3. Check ERPNext logs: `bench logs` (if using Frappe Bench)
4. Verify connectivity: `node test-erpnext-connection.js`
5. Review ERPNext API documentation: https://frappeframework.com/docs/user/en/api

## License

Part of the ERPNext Document Intelligence system.
