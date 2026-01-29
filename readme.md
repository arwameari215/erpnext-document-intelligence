# ERPNext Document Intelligence UI

A modern, responsive frontend UI for processing and managing PDF documents (Invoices and Purchase Orders) with Document Intelligence capabilities for ERPNext.

## Features

- **Document Type Selection**: Choose between Invoice and Purchase Order processing
- **PDF Upload**: Secure PDF file upload with validation
- **Intelligent Parsing**: Automatic extraction of document data via API integration
- **Editable Forms**: Review and edit extracted data with highlighted missing fields
- **Line Items Management**: Editable tables for invoice/PO items with automatic calculations
- **Validation**: Built-in field validation before confirmation
- **Responsive Design**: Clean, ERP-style interface that works on all devices

## Tech Stack

- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests

## Project Structure

```
erpnext-document-intelligence/
├── src/
│   ├── components/
│   │   ├── InvoiceForm.jsx       # Invoice preview and editing component
│   │   └── PurchaseOrderForm.jsx # Purchase Order preview and editing component
│   ├── App.jsx                    # Main application component
│   ├── App.css                    # Global styles
│   └── main.jsx                   # Application entry point
├── index.html                     # HTML template
├── package.json                   # Dependencies and scripts
├── vite.config.js                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── postcss.config.js              # PostCSS configuration
```

## Installation

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure API endpoint** (optional):
   Edit `vite.config.js` to update the proxy target to your API server URL:
   ```javascript
   proxy: {
     '/upload': {
       target: 'http://localhost:5000', // Update with your API URL
       changeOrigin: true,
     }
   }
   ```

### Python/ERPNext Integration Setup

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Configure ERPNext API credentials**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your ERPNext credentials
   ```
   
   Update the [.env](.env) file with your actual ERPNext details:
   ```env
   ERPNEXT_BASE_URL=http://your-erpnext-instance:8080
   ERPNEXT_API_KEY=your_api_key_here
   ERPNEXT_API_SECRET=your_api_secret_here
   ERPNEXT_DEFAULT_COMPANY=Your Company Name
   ERPNEXT_DEFAULT_SUPPLIER=Your Supplier Name
   ```

3. **Generate ERPNext API Keys**:
   - Login to your ERPNext instance
   - Go to User → Your Profile
   - Click on "API Access"
   - Generate API Key and Secret
   - Copy them to your [.env](.env) file

**⚠️ Security Note**: Never commit your `.env` file to version control. It's already added to [.gitignore](.gitignore).
     '/upload': {
       target: 'http://localhost:5000', // Update with your API URL
       changeOrigin: true,
     }
   }
   ```

## Running the Application

### Frontend Development Mode
```bash
npm run dev
```
The application will start at `http://localhost:3000`

### Test ERPNext Integration
```bash
# Test the ERPNext API connection and create a sample PO
python create_po_erpnext.py
```

This will:
- Validate your ERPNext credentials
- Create test Company, Supplier, and Item
- Create a sample Purchase Order
- Display success/error messages

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## Usage

### User Flow

1. **Select Document Type**
   - Choose either "Invoice" or "Purchase Order" from the dropdown
   - Upload button becomes enabled

2. **Upload PDF**
   - Click "Choose PDF File" to select your document
   - Only PDF files are accepted
   - Selected filename is displayed

3. **Process Document**
   - Click "Upload & Process"
   - API processes the document based on type:
     - Invoice → `POST /upload/invoice`
     - Purchase Order → `POST /upload/po`

4. **Review & Edit**
   - Extracted data is displayed in editable forms
   - Missing/null fields are highlighted in yellow
   - Edit any fields as needed
   - Modify line items (quantities, rates, amounts)

5. **Confirm**
   - Click "Confirm & Continue"
   - Data is validated
   - Success message is displayed
   - Data is prepared for ERPNext upload (integration pending)

## API Integration

### ERPNext Integration

The [create_po_erpnext.py](create_po_erpnext.py) script handles data ingestion to ERPNext:

**Schema Mapping**:
- Form data from `PurchaseOrderForm.jsx` is automatically mapped to ERPNext Purchase Order schema
- The `map_form_to_erpnext()` function handles field transformations:
  - `po_number` → `naming_series`
  - `date` → `transaction_date`
  - `delivery_date` → `schedule_date`
  - `supplier_name` → `supplier`
  - `company_name` → `company`
  - `items[].description` → `items[].item_name`
  - `items[].quantity` → `items[].qty`
  - `items[].unit_price` → `items[].rate`

**Usage in Code**:
```python
from create_po_erpnext import create_purchase_order_from_form

# Your form data from frontend
form_data = {
    "po_number": "PO-2026-001",
    "date": "2026-01-28",
    "delivery_date": "2026-02-15",
    "supplier_name": "ABC Suppliers",
    "company_name": "My Company",
    "items": [
        {
            "description": "Office Chair",
            "quantity": 5,
            "unit_price": 150.00,
            "total": 750.00
        }
    ]
}

# Create PO in ERPNext
po = create_purchase_order_from_form(form_data, submit=True)
print(f"Created PO: {po['name']}")
```

### Invoice API Response Structure
```json
{
  "confidence": 0.85,
  "data": {
    "InvoiceId": "36259",
    "VendorName": "SuperStore",
    "InvoiceDate": "2012-03-06",
    "BillingAddressRecipient": "Aaron Bergman",
    "ShippingAddress": "98103, Seattle, Washington, United States",
    "SubTotal": 53.82,
    "ShippingCost": 4.29,
    "InvoiceTotal": 58.11,
    "Tax": null,
    "Items": [
      {
        "description": "Newell 330",
        "category": "Art, Office Supplies, OFF-AR-5309",
        "quantity": 3,
        "rate": 17.94,
        "amount": 53.82
      }
    ]
  },
  "predictionTime": 7.067
}
```

### Purchase Order API Response Structure
```json
{
  "po_number": "36259",
  "date": "2012-03-06",
  "delivery_date": null,
  "supplier_name": "SuperStore",
  "company_name": "Aaron Bergman",
  "total_amount": 58.11,
  "status": "Pending",
  "items": [
    {
      "description": "Newell 330 - Art, Office Supplies, OFF-AR-5309",
      "quantity": 3.0,
      "unit_price": 17.94,
      "total": 53.82
    }
  ]
}
```

## Components

### App.jsx
Main application component managing:
- Document type selection
- File upload
- API communication
- Component routing
- State management

### InvoiceForm.jsx
Handles invoice document display and editing:
- Confidence score display
- Invoice details form (9 fields)
- Items table with editable rows
- Field validation
- Null value highlighting

### PurchaseOrderForm.jsx
Handles purchase order display and editing:
- Status badge display
- PO details form (7 fields)
- Items table with editable rows
- Field validation
- Delivery date highlighting

## Customization

### Styling
- Edit `tailwind.config.js` for custom colors, fonts, etc.
- Modify `src/App.css` for global styles
- Component-specific styles use Tailwind utility classes

### API Endpoints
Update endpoints in `src/App.jsx`:
```javascript
const endpoint = documentType === 'invoice' 
  ? '/upload/invoice'  // Change endpoint here
  : '/upload/po';      // Change endpoint here
```

### Validation Rules
Modify validation in form components:
```javascript
// InvoiceForm.jsx or PurchaseOrderForm.jsx
const handleConfirm = () => {
  // Add custom validation logic here
};
```

## Future Enhancements

- [ ] Add/Remove line items functionality
- [ ] Document preview (PDF viewer)
- [ ] Batch document processing
- [ ] Export to CSV/Excel
- [ ] Document history/audit trail
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Real-time sync with ERPNext webhooks
- [ ] Duplicate detection

## Documentation

- 📖 [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions for ERPNext integration
- 🏗️ [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and data flow diagrams
- 📝 [example_form_integration.py](example_form_integration.py) - Working code example

## Quick Start (ERPNext Integration)

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure credentials
cp .env.example .env
# Edit .env with your ERPNext credentials

# 3. Test connection
python create_po_erpnext.py

# 4. Or use the setup script
./setup.sh          # Linux/Mac
.\setup.ps1         # Windows PowerShell
```

## Notes

- **ERPNext Integration**: The UI is prepared for ERPNext integration. The comment `// ERPNext integration will be added here later` marks where to add the actual API calls.
- **Field Highlighting**: Yellow-highlighted fields indicate missing or null values that may need attention.
- **Auto-calculation**: Line item amounts are automatically calculated when quantity or rate changes.

## License

This project is part of the ERPNext Document Intelligence system.

## Support

For issues or questions, please contact your system administrator or refer to the ERPNext documentation.
