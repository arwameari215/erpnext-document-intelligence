import React, { useState } from 'react';
import axios from 'axios';
import InvoiceForm from './components/InvoiceForm';
import PurchaseOrderForm from './components/PurchaseOrderForm';
import './App.css';

function App() {
  const [documentType, setDocumentType] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // Handle document type selection
  const handleDocumentTypeChange = (e) => {
    setDocumentType(e.target.value);
    setSelectedFile(null);
    setFileName('');
    setParsedData(null);
    setError('');
    setConfirmed(false);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setFileName(file.name);
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
      setFileName('');
    }
  };

  // Handle file upload and API call
  const handleUpload = async () => {
    if (!selectedFile || !documentType) return;

    setLoading(true);
    setError('');
    setParsedData(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Route to appropriate API based on document type
      const endpoint = documentType === 'invoice' 
        ? '/upload/invoice' 
        : '/upload/po';

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setParsedData(response.data);
      setConfirmed(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process document. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle confirmation
  const handleConfirm = (data) => {
    console.log('Confirmed data ready for ERPNext:', data);
    setConfirmed(true);
    // ERPNext integration will be added here later
  };

  // Reset to upload new document
  const handleReset = () => {
    setSelectedFile(null);
    setFileName('');
    setParsedData(null);
    setError('');
    setConfirmed(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            ERPNext Document Intelligence
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Upload and process invoices and purchase orders
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        {!parsedData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Upload Document
            </h2>

            {/* Document Type Selection */}
            <div className="mb-6">
              <label 
                htmlFor="documentType" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Type
              </label>
              <select
                id="documentType"
                value={documentType}
                onChange={handleDocumentTypeChange}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select document type...</option>
                <option value="invoice">Invoice</option>
                <option value="po">Purchase Order</option>
              </select>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label 
                htmlFor="fileUpload" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Upload PDF
              </label>
              <div className="flex items-center gap-4">
                <label
                  htmlFor="fileUpload"
                  className={`px-6 py-3 rounded-md font-medium transition-colors ${
                    !documentType
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                  }`}
                >
                  Choose PDF File
                  <input
                    id="fileUpload"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    disabled={!documentType}
                    className="hidden"
                  />
                </label>
                {fileName && (
                  <span className="text-sm text-gray-600">
                    Selected: <span className="font-medium">{fileName}</span>
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {!documentType 
                  ? 'Please select a document type first' 
                  : 'Only PDF files are accepted'}
              </p>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className={`px-8 py-3 rounded-md font-medium transition-colors ${
                !selectedFile || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {loading ? 'Processing...' : 'Upload & Process'}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Confirmation Success Message */}
        {confirmed && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <svg 
                className="w-6 h-6 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Document data is ready for ERPNext upload.
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  The document has been successfully processed and validated.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="mt-4 px-6 py-2 bg-white border border-green-300 text-green-700 rounded-md hover:bg-green-50 font-medium"
            >
              Upload Another Document
            </button>
          </div>
        )}

        {/* Parsed Data Forms */}
        {parsedData && !confirmed && (
          <>
            {documentType === 'invoice' && (
              <InvoiceForm 
                data={parsedData} 
                onConfirm={handleConfirm}
                onCancel={handleReset}
              />
            )}
            {documentType === 'po' && (
              <PurchaseOrderForm 
                data={parsedData} 
                onConfirm={handleConfirm}
                onCancel={handleReset}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
