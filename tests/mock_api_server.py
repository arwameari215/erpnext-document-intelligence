"""
Mock API Server for Tests
Runs a simple HTTP server that mocks the PDF extraction and ERPNext APIs
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading


class MockAPIHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        """Suppress server logs"""
        pass

    def _send_json_response(self, status, data):
        self.send_response(status)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"
        )
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"
        )
        self.send_header(
            "Access-Control-Allow-Headers", "Content-Type, Authorization"
        )
        self.end_headers()

    def do_POST(self):
        """Handle POST requests"""

        # ---------------------------
        # Invoice extraction mock
        # ---------------------------
        if "/upload/invoice" in self.path:
            self._send_json_response(
                200,
                {
                    "data": {
                        "InvoiceId": "INV-2026-001",
                        "VendorName": "Test Customer",
                        "InvoiceDate": "2026-01-29",
                        "DueDate": "2026-02-28",
                        "BillingAddressRecipient": "Test Customer",
                        "ShippingAddress": "123 Test St",
                        "Currency": "USD",
                        "SubTotal": 200.00,
                        "ShippingCost": 15.00,
                        "Tax": 35.00,
                        "InvoiceTotal": 250.00,
                        "Items": [
                            {
                                "description": "Test Item 1",
                                "category": "Electronics",
                                "quantity": 2,
                                "rate": 100.00,
                                "amount": 200.00,
                            }
                        ],
                    }
                },
            )

        # ---------------------------
        # Purchase Order extraction
        # ---------------------------
        elif "/upload/po" in self.path:
            self._send_json_response(
                200,
                {
                    "po_number": "PO-2026-00001",
                    "date": "2026-01-29",
                    "delivery_date": "2026-02-15",
                    "supplier_name": "ABC Supplier",
                    "company_name": "My Company",
                    "currency": "USD",
                    "total_amount": 292.50,
                    "status": "Draft",
                    "items": [
                        {
                            "item_code": "ITEM-001",
                            "item_name": "Steel Rod",
                            "description": "Steel Rod",
                            "quantity": 10,
                            "unit_price": 25.00,
                            "total": 250.00,
                        }
                    ],
                },
            )

        # ---------------------------
        # ERPNext submission (CRITICAL FIX)
        # ---------------------------
        elif "frappe.client.submit" in self.path or "submit" in self.path:
            # Submission changes docstatus to 1
            self._send_json_response(
                200,
                {
                    "data": {
                        "name": "Submitted",
                        "docstatus": 1,
                    }
                },
            )

        # ---------------------------
        # Sales Invoice creation
        # ---------------------------
        elif "Sales Invoice" in self.path or "Sales%20Invoice" in self.path:
            self._send_json_response(
                200,
                {"data": {"name": "SINV-2026-00001", "docstatus": 0}},
            )

        # ---------------------------
        # Purchase Order creation
        # ---------------------------
        elif "Purchase Order" in self.path or "Purchase%20Order" in self.path:
            self._send_json_response(
                200,
                {"data": {"name": "PO-2026-00001", "docstatus": 0}},
            )

        # ---------------------------
        # Entity creation mocks
        # ---------------------------
        elif (
            "/Customer" in self.path
            or "/Item" in self.path
            or "/Company" in self.path
            or "/Supplier" in self.path
        ):
            self._send_json_response(200, {"data": {"name": "Created"}})

        else:
            self._send_json_response(200, {"data": {}})

    def do_GET(self):
        """Handle GET requests"""

        if "/Company/" in self.path:
            self._send_json_response(
                200,
                {"data": {"name": "DEMO", "default_currency": "USD"}},
            )

        elif (
            "/Customer/" in self.path
            or "/Item/" in self.path
            or "/Supplier/" in self.path
        ):
            self._send_json_response(404, {"exc": "Not Found"})

        else:
            self._send_json_response(200, {"data": {}})

    def do_PUT(self):
        """Handle PUT requests"""

        # fallback submission support
        if "SINV-" in self.path or "PO-" in self.path:
            doc_name = (
                "SINV-2026-00001" if "SINV-" in self.path else "PO-2026-00001"
            )
            self._send_json_response(
                200,
                {"data": {"name": doc_name, "docstatus": 1}},
            )
        else:
            self._send_json_response(200, {"data": {}})


class MockAPIServer:
    """Mock API Server Manager"""

    def __init__(self, port=8000):
        self.port = port
        self.server = None
        self.thread = None

    def start(self):
        self.server = HTTPServer(("localhost", self.port), MockAPIHandler)
        self.thread = threading.Thread(
            target=self.server.serve_forever, daemon=True
        )
        self.thread.start()
        print(f"Mock API server started on http://localhost:{self.port}")

    def stop(self):
        if self.server:
            self.server.shutdown()
            self.thread.join(timeout=5)
            print("Mock API server stopped")


class MockERPNextServer(MockAPIServer):
    def __init__(self):
        super().__init__(port=8080)
