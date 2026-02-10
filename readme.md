# ERPNext Document Intelligence

A document processing web application for uploading and managing Purchase Orders and Sales Invoices.

testing changes---2

## Overview

This application consists of two main components:
- **Frontend (React + Next.js)**: Modern UI for uploading PDFs and managing document data
- **Backend (Python + Flask)**: PDF file handling and mock data generation

## Features

### Document Processing
- **PDF Upload**: Upload Purchase Order and Sales Invoice PDFs
- **Mock Data Generation**: Backend returns structured mock data for testing
- **Editable Forms**: Review and modify document data in user-friendly forms
- **Validation**: Client-side validation for data integrity

### Architecture
- **Simple**: Lightweight Flask backend for quick prototyping
- **Modern**: React frontend with Tailwind CSS styling
- **RESTful**: Clean API design with proper error handling
- **No External Dependencies**: Works standalone without ERPNext or AI services

## Tech Stack

### Frontend
- React 18 + Next.js 14 (App Router)
- Tailwind CSS
- Fetch API for HTTP requests

### Backend
- Python 3.10+
- Flask
- Flask-CORS

## Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.10+

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
# Install dependencies
pip install flask flask-cors

# No environment variables or configuration needed
```

### 4. Start Services

**Terminal 1 - Backend API:**
```bash
python api_server.py
```

Backend will start at: http://localhost:8000
- Health check: http://localhost:8000/health

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Frontend will start at: http://localhost:3000

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
│ Next.js Frontend│
│  - Upload UI    │
│  - Form Editor  │
│  - Validation   │
│  - API Proxy    │
└────────┬────────┘
         │ REST API (proxied)
         ↓
┌─────────────────┐
│  Flask Backend  │
│  (Port 8000)    │
│  - File Handling│
│  - Mock Data    │
└────────┬────────┘
         │
         ↓
┌──────────────┐
│ File Storage │
│ (uploads/)   │
└──────────────┘
```

### Request Flow

#### Purchase Order Processing:

1. **Upload Phase**
   ```
   User uploads PDF → Frontend → POST /upload/po → Backend
   Backend saves file and returns mock structured data
   Frontend displays editable form
   ```

2. **Form Editing**
   ```
   User reviews and edits:
   - PO Number, Dates
   - Supplier and Company information
   - Line items (description, quantity, price)
   Frontend validates data client-side
   ```

#### Sales Invoice Processing:

1. **Upload Phase**
   ```
   User uploads PDF → Frontend → POST /upload/invoice → Backend
   Backend saves file and returns mock structured data
   Frontend displays editable form
   ```

2. **Form Editing**
   ```
   User reviews and edits:
   - Invoice ID, Dates
   - Customer and vendor information
   - Line items (description, quantity, price)
   - Shipping and tax details
   Frontend validates data client-side
## Usage Guide

### Processing Purchase Orders

1. **Select Document Type**
   - Choose "Purchase Order" from the dropdown

2. **Upload PDF**
   - Click "Choose File" and select your PO PDF
   - Click "Upload & Process"
   - Backend generates mock PO data

3. **Review Extracted Data**
   - PO Number
   - Supplier Name & Company Name
   - Order Date & Delivery Date
   - Total Amount & Status
   - Line Items (Description, Quantity, Unit Price, Total)

4. **Edit as Needed**
   - Modify any fields in the form
   - Add/remove line items using the table controls
   - Update quantities or prices
   - All changes are local (no backend submission)

### Processing Sales Invoices

1. **Select Document Type**
   - Choose "Sales Invoice" from the dropdown

2. **Upload PDF**
   - Click "Choose File" and select your invoice PDF
   - Click "Upload & Process"
   - Backend generates mock invoice data

3. **Review Extracted Data**
   - Invoice ID & Vendor Name
   - Customer Name & Billing Address
   - Invoice Date & Shipping Address
   - Subtotal, Shipping Cost, Tax, Total
   - Line Items (Description, Category, Quantity, Rate, Amount)

4. **Edit as Needed**
   - Modify customer information
   - Update dates and addresses
   - Edit line items
   - Update shipping cost and tax
   - All changes are local (no backend submission)

### What Happens Behind the Scenes

**During Upload:**
- Frontend sends PDF to backend `/upload/po` or `/upload/invoice`
- Backend saves file to `uploads/` folder with timestamp
- Backend generates mock structured data matching form schema
- Backend returns JSON with all fields populated
- Frontend populates form with received data
- File remains stored in `uploads/` directory

## Configuration Details

### Frontend Configuration (Next.js)

**Development Server:** Port 3000 (default Next.js port)  
**API Proxy Configured:** Backend requests are proxied through Next.js rewrites

**Services Configuration:**
Services make relative API calls (proxied to backend by Next.js):
```javascript
// API calls like '/upload/invoice' are automatically proxied to http://localhost:8000
```

**Next.js Configuration (next.config.js):**
```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/upload/:path*',
        destination: 'http://localhost:8000/upload/:path*',
      },
      {
        source: '/erpnext/:path*',
        destination: 'http://localhost:8000/erpnext/:path*',
      },
    ];
  },
};
```

**No Authentication Required:**  
No environment variables, API keys, or credentials needed.

### Backend Configuration (Flask)

**Development Server:** Port 8000  
**No Environment Variables Required**

**Configuration:**
```python
# Flask app configuration
UPLOAD_FOLDER = 'uploads'
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
```

**CORS:**  
CORS is enabled for all origins using Flask-CORS:
```python
from flask_cors import CORS
CORS(app)
```

**File Storage:**
- Uploaded files are saved to `uploads/` directory
- Files are named with timestamp: `invoice_YYYYMMDD_HHMMSS_originalname.pdf`
- Files persist after upload (not deleted automatically)

## Validation Rules

### Purchase Order Validation
- **PO Number**: Required (client-side)
- **Supplier Name**: Required (client-side)
- **Company Name**: Required (client-side)
- **Order Date**: Required (client-side)
- **Delivery Date**: Required (client-side)
- **Total Amount**: Calculated from items
- **Items**: At least one required
  - Description: Required
  - Quantity: Must be > 0
  - Unit Price: Must be ≥ 0

### Sales Invoice Validation
- **Invoice ID**: Required (client-side)
- **Vendor Name**: Required (client-side)
- **Customer Name**: Required (client-side)
- **Invoice Date**: Required (client-side)
- **Billing Address**: Required (client-side)
- **Shipping Address**: Required (client-side)
- **Items**: At least one required
  - Description: Required
  - Quantity: Must be > 0
  - Rate: Must be ≥ 0

## Troubleshooting

### Frontend Issues

**Problem:** "Failed to fetch" or network error  
**Solutions:**
1. Verify backend is running on port 8000
2. Check that backend URL is correct (`http://localhost:8000`)
3. Check browser console for detailed error messages
4. Ensure CORS is enabled in Flask backend

**Problem:** File upload fails  
**Solutions:**
1. Verify file is a valid PDF
2. Check file size is under 16MB
3. Ensure `uploads/` directory exists and is writable
4. Check backend terminal for error messages

**Problem:** Form not populating after upload  
**Solutions:**
1. Check browser console for JavaScript errors
2. Verify backend response format matches expected schema
3. Check network tab to see actual response data

### Backend Issues

**Problem:** "Address already in use" error  
**Solutions:**
1. Another process is using port 8000
2. Find and kill the process: `netstat -ano | findstr :8000` (Windows)
3. Or use a different port: `app.run(port=8001)`

**Problem:** Import errors (flask, flask_cors not found)  
**Solutions:**
1. Install dependencies: `pip install flask flask-cors`
2. Verify Python environment is activated if using venv

**Problem:** File not found errors  
**Solutions:**
1. Ensure `uploads/` directory exists
2. Check file permissions
3. Create directory manually if needed

## Project Structure

```
erpnext-document-intelligence/
├── src/
│   ├── components/
│   │   ├── InvoiceForm.jsx           # Sales Invoice form UI
│   │   └── PurchaseOrderForm.jsx     # Purchase Order form UI
│   ├── services/
│   │   ├── erpnextPurchaseOrderService.js  # PO backend API client
│   │   └── erpnextSalesInvoiceService.js   # Invoice backend API client
│   ├── App.jsx                       # Main application component
│   ├── App.css                       # Application styles
│   └── main.jsx                      # Entry point
├── tests/                            # E2E test suite (Selenium)
│   ├── test_invoice_integration.py   # Integration tests
│   ├── test_invoice_mocked.py        # Mocked API tests
│   ├── test_po_mocked.py             # PO mocked tests
│   ├── config.py                     # Test configuration
│   ├── requirements.txt              # Test dependencies
│   ├── mock_api_server.py            # Mock backend for testing
│   ├── page_objects/                 # Page Object Model
│   │   ├── base_page.py
│   │   ├── home_page.py
│   │   ├── invoice_form_page.py
│   │   └── purchase_order_form_page.py
│   └── utils/
│       └── api_checker.py            # API validation utilities
├── uploads/                          # PDF storage directory
├── api_server.py                     # Flask backend server
├── next.config.js                    # Next.js configuration
├── tailwind.config.js                # Tailwind CSS config
├── postcss.config.js                 # PostCSS config
├── package.json                      # Frontend dependencies
├── app/                              # Next.js App Router directory
│   ├── layout.js                     # Root layout
│   ├── page.js                       # Main page (home)
│   └── globals.css                   # Global styles
├── components/                       # React components (shared)
│   ├── InvoiceForm.jsx
│   └── PurchaseOrderForm.jsx
├── services/                         # API service clients
│   ├── erpnextSalesInvoiceService.js
│   └── erpnextPurchaseOrderService.js
└── readme.md                         # This file
```

### Key Files Explained

**Frontend:**
- [app/page.js](app/page.js): Main application page with document type selection and file upload
- [app/layout.js](app/layout.js): Root layout with metadata and global styles
- [components/InvoiceForm.jsx](components/InvoiceForm.jsx): Sales invoice form with validation
- [components/PurchaseOrderForm.jsx](components/PurchaseOrderForm.jsx): Purchase order form with validation
- [services/erpnextPurchaseOrderService.js](services/erpnextPurchaseOrderService.js): HTTP client for PO endpoints
- [services/erpnextSalesInvoiceService.js](services/erpnextSalesInvoiceService.js): HTTP client for invoice endpoints

**Backend:**
- [api_server.py](api_server.py): Flask server with upload endpoints and mock data generation

**Configuration:**
- [next.config.js](next.config.js): Next.js configuration with API rewrites
- [tailwind.config.js](tailwind.config.js): Tailwind CSS customization
- [package.json](package.json): NPM dependencies and scripts

**Testing:**
- [tests/](tests/): Complete E2E test suite using Selenium WebDriver
- [tests/mock_api_server.py](tests/mock_api_server.py): Standalone mock backend for testing

## API Reference

### Backend API Endpoints

#### Upload Endpoints

**POST `/upload/po`**  
Upload Purchase Order PDF and receive mock data.

Request:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

fetch('http://localhost:8000/upload/po', {
  method: 'POST',
  body: formData
});
```

Response:
```json
{
  "po_number": "PO-2026-001",
  "date": "2026-02-01",
  "delivery_date": "2026-02-15",
  "supplier_name": "ABC Suppliers Inc",
  "company_name": "My Company",
  "total_amount": 1520.00,
  "status": "Pending",
  "items": [
    {
      "description": "Ergonomic Office Chair",
      "quantity": 5,
      "unit_price": 150.00,
      "total": 750.00
    }
  ],
  "filename": "po_20260201_120000_original.pdf"
}
```

**POST `/upload/invoice`**  
Upload Sales Invoice PDF and receive mock data.

Request:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

fetch('http://localhost:8000/upload/invoice', {
  method: 'POST',
  body: formData
});
```

Response:
```json
{
  "confidence": 0.85,
  "data": {
    "InvoiceId": "INV-2026-001",
    "VendorName": "Sample Vendor Inc",
    "InvoiceDate": "2026-02-01",
    "BillingAddressRecipient": "John Doe",
    "ShippingAddress": "123 Main St, City, State 12345",
    "SubTotal": 1000.00,
    "ShippingCost": 50.00,
    "InvoiceTotal": 1100.00,
    "Tax": 50.00,
    "Items": [
      {
        "description": "Sample Product 1",
        "category": "Category A",
        "quantity": 2,
        "rate": 300.00,
        "amount": 600.00
      }
    ]
  },
  "predictionTime": 2.5,
  "filename": "invoice_20260201_120000_original.pdf"
}
```

#### Health Check Endpoints

**GET `/health`**  
Check backend server health.

Response:
```json
{
  "status": "healthy",
  "service": "Document Intelligence API",
  "timestamp": "2026-02-01T12:00:00"
}
```

**GET `/`**  
Get API information and available endpoints.

Response:
```json
{
  "service": "ERPNext Document Intelligence API",
  "version": "1.0.0",
  "endpoints": {
    "/upload/invoice": "POST - Upload and process invoice PDF",
    "/upload/po": "POST - Upload and process purchase order PDF",
    "/health": "GET - Health check"
  }
}
```

## Testing

### Manual Testing

1. **Start Services:**
   ```bash
   # Terminal 1: Start backend
   python api_server.py
   
   # Terminal 2: Start frontend
   npm run dev
   ```

2. **Test Application:**
   - Open http://localhost:3000
   - Select document type (PO or Invoice)
   - Upload any PDF file
   - Verify mock data appears in form
   - Edit fields as needed
   - Verify validation works

### Automated Testing

The project includes E2E tests using Selenium WebDriver:

**Run Tests:**
```bash
cd tests
pip install -r requirements.txt
python run_tests.py
```

Tests verify:
- File upload functionality
- Form population with mock data
- Client-side validation
- UI interactions

## Available Scripts

### Frontend

```bash
npm install          # Install dependencies
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server (port 3000)
```

### Backend

```bash
pip install flask flask-cors    # Install Python dependencies
python api_server.py            # Start Flask server (port 8000)
```

### Testing

```bash
cd tests
pip install -r requirements.txt # Install test dependencies
python run_tests.py             # Run E2E tests
```

## Future Enhancements

This is a prototype/demo application. Potential enhancements include:

- **AI Integration**: Add Claude API or Azure Document Intelligence for real PDF parsing
- **ERPNext Integration**: Connect to actual ERPNext instance for document creation
- **Database**: Add persistence layer for uploaded documents
- **Authentication**: Add user authentication and authorization
- **File Management**: Implement file cleanup, preview, and download features
- **Advanced Validation**: Server-side validation and business rule enforcement
- **Real-time Updates**: WebSocket support for live processing status
- **Multi-tenancy**: Support multiple companies/organizations

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section
- Review browser console for frontend errors
- Check backend terminal for Flask errors
- Verify both services are running on correct ports

## License

Part of the ERPNext Document Intelligence system.
