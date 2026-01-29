"""
Flask Backend API Server for Document Intelligence
Handles PDF upload and processing for Invoices and Purchase Orders
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Configure upload folder
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


@app.route('/upload/invoice', methods=['POST'])
def upload_invoice():
    """
    Handle invoice PDF upload and processing.
    Returns parsed invoice data.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are accepted'}), 400
    
    # Save the uploaded file
    filename = f"invoice_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    print(f"✅ Invoice uploaded: {filename}")
    
    # TODO: Integrate with your actual document intelligence API
    # For now, returning mock data
    mock_data = {
        "confidence": 0.85,
        "data": {
            "InvoiceId": "INV-2026-001",
            "VendorName": "Sample Vendor Inc",
            "InvoiceDate": datetime.now().strftime("%Y-%m-%d"),
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
                },
                {
                    "description": "Sample Product 2",
                    "category": "Category B",
                    "quantity": 1,
                    "rate": 400.00,
                    "amount": 400.00
                }
            ]
        },
        "predictionTime": 2.5,
        "filename": filename
    }
    
    return jsonify(mock_data), 200


@app.route('/upload/po', methods=['POST'])
def upload_po():
    """
    Handle purchase order PDF upload and processing.
    Returns parsed PO data.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    if not file.filename.endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are accepted'}), 400
    
    # Save the uploaded file
    filename = f"po_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)
    
    print(f"✅ Purchase Order uploaded: {filename}")
    
    # TODO: Integrate with your actual document intelligence API
    # For now, returning mock data matching PurchaseOrderForm schema
    mock_data = {
        "po_number": "PO-2026-001",
        "date": datetime.now().strftime("%Y-%m-%d"),
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
            },
            {
                "description": "Standing Desk - Adjustable",
                "quantity": 3,
                "unit_price": 250.00,
                "total": 750.00
            },
            {
                "description": "Monitor Arm Mount",
                "quantity": 4,
                "unit_price": 80.00,
                "total": 320.00
            }
        ],
        "filename": filename
    }
    
    return jsonify(mock_data), 200


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'service': 'Document Intelligence API',
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/', methods=['GET'])
def index():
    """API root endpoint."""
    return jsonify({
        'service': 'ERPNext Document Intelligence API',
        'version': '1.0.0',
        'endpoints': {
            '/upload/invoice': 'POST - Upload and process invoice PDF',
            '/upload/po': 'POST - Upload and process purchase order PDF',
            '/health': 'GET - Health check'
        }
    }), 200


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Document Intelligence API Server")
    print("=" * 60)
    print("📡 Server starting on http://localhost:8000")
    print("📂 Upload folder:", UPLOAD_FOLDER)
    print("📝 Endpoints:")
    print("   - POST /upload/invoice")
    print("   - POST /upload/po")
    print("   - GET  /health")
    print("=" * 60)
    print()
    
    app.run(host='0.0.0.0', port=8000, debug=True, use_reloader=False)
