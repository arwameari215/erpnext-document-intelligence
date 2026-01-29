# ERPNext Document Intelligence UI

A modern React application for processing PDF documents (Purchase Orders and Invoices) with intelligent data extraction and direct ERPNext integration.

## Features

- **PDF Document Processing**: Upload and parse Purchase Order and Invoice PDFs
- **Intelligent Data Extraction**: Automatic field extraction via API integration
- **Editable Forms**: Review and edit extracted data with validation
- **Direct ERPNext Integration**: Submit Purchase Orders directly to ERPNext
- **Multi-Currency Support**: Handle multiple currencies with exchange rates
- **Real-time Status Updates**: Live feedback during ERPNext submission
- **Automatic Entity Creation**: Creates Company, Supplier, and Items if not in ERPNext
- **Responsive Design**: Clean, modern UI that works on all devices

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- ERPNext REST API
- Axios for HTTP requests

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create `.env` file with your ERPNext credentials:

```env
# Leave empty to use Vite proxy (recommended for development)
VITE_ERPNEXT_URL=

# ERPNext API Credentials (get from ERPNext → User Profile → API Access)
VITE_ERPNEXT_API_KEY=your_api_key_here
VITE_ERPNEXT_API_SECRET=your_api_secret_here
```

### 3. Start Development Server

```bash
npm run dev
```

Application runs at `http://localhost:3000`

## Getting ERPNext API Credentials

1. Login to ERPNext (default: `http://localhost:8080`)
2. Go to User Profile → API Access
3. Click "Generate Keys"
4. Copy API Key and API Secret to `.env` file
5. Restart dev server

## Usage

### Processing Purchase Orders

1. Select "Purchase Order" from document type dropdown
2. Upload PDF file
3. Click "Upload & Process"
4. Review extracted data:
   - Supplier Name
   - Company Name  
   - Order Date
   - Delivery Date
   - Currency
   - Line Items
5. Edit any fields as needed
6. Add/remove items using table controls
7. Click "Submit to ERPNext"
8. View success message with ERPNext PO number

### What Happens When You Submit

1. **Validates** all required fields
2. **Checks/Creates** Company in ERPNext
3. **Checks/Creates** Supplier in ERPNext
4. **Checks/Creates** Items in ERPNext (one per line item)
5. **Creates** Purchase Order in ERPNext
6. **Submits** Purchase Order (sets docstatus = 1)
7. **Returns** ERPNext PO number with direct link

## Configuration

### Vite Proxy Setup

The application uses Vite's proxy to avoid CORS issues:

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // ERPNext URL
      changeOrigin: true,
    }
  }
}
```

Leave `VITE_ERPNEXT_URL` empty in `.env` to use the proxy.

### Warehouse Configuration

Items require a warehouse. Default is `'Stores - MC'`. To change:

```javascript
// src/services/erpnextService.js
warehouse: item.warehouse || 'Your-Warehouse-Name'
```

Find warehouse names in ERPNext → Stock → Warehouse

## Validation Rules

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

## Troubleshooting

### "Exchange rate not configured"

Add exchange rate in ERPNext:
- Go to Setup → Currency Exchange
- Add rate for your currency

### "Warehouse is mandatory for stock Item"

Item is marked as stock item in ERPNext. Either:
1. Update warehouse in `erpnextService.js`
2. Change item to non-stock in ERPNext

### "Network error: Failed to fetch"

1. Verify ERPNext is running: `curl http://localhost:8080/api/method/ping`
2. Ensure `.env` has empty `VITE_ERPNEXT_URL` to use proxy
3. Restart dev server

### "API credentials not configured"

1. Check `.env` file exists with credentials
2. Restart dev server (required after .env changes)

## Project Structure

```
src/
├── components/
│   ├── InvoiceForm.jsx          # Invoice form component
│   └── PurchaseOrderForm.jsx    # Purchase Order form with ERPNext integration
├── services/
│   └── erpnextService.js        # ERPNext REST API integration
├── App.jsx                      # Main application
└── main.jsx                     # Entry point

vite.config.js                   # Vite configuration with proxy
.env                             # Environment variables (not in git)
.env.example                     # Template for .env
```

## API Integration

### ERPNext Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/resource/Company/{name}` | Check company exists |
| POST | `/api/resource/Company` | Create company |
| GET | `/api/resource/Supplier/{name}` | Check supplier exists |
| POST | `/api/resource/Supplier` | Create supplier |
| GET | `/api/resource/Item/{code}` | Check item exists |
| POST | `/api/resource/Item` | Create item |
| POST | `/api/resource/Purchase Order` | Create purchase order |
| PUT | `/api/resource/Purchase Order/{name}` | Submit purchase order |

### Authentication

All requests include:

```javascript
Authorization: token <API_KEY>:<API_SECRET>
Content-Type: application/json
```

## Security Considerations

⚠️ **Current Setup**: For local/development only

**For Production**:
- Implement backend API proxy
- Store credentials server-side only
- Use OAuth/JWT authentication
- Enable HTTPS
- Add rate limiting
- Implement proper CORS policies

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ERPNEXT_URL` | ERPNext base URL (empty for proxy) | `` |
| `VITE_ERPNEXT_API_KEY` | ERPNext API key | `abc123...` |
| `VITE_ERPNEXT_API_SECRET` | ERPNext API secret | `def456...` |

## License

Part of the ERPNext Document Intelligence system.

## Support

For issues:
1. Check browser console for errors
2. Verify ERPNext is running
3. Check ERPNext logs: `bench logs`
4. Ensure API credentials are valid
