import React, { useState, useEffect } from 'react';
import { submitPurchaseOrderToERPNext } from '../services/erpnextPurchaseOrderService';

function PurchaseOrderForm({ data, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    po_number: '',
    date: '',
    delivery_date: '',
    supplier_name: '',
    company_name: '',
    currency: '',
    total_amount: 0,
    status: '',
    items: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [erpnextPONumber, setErpnextPONumber] = useState(null);

  // Initialize form data from API response
  useEffect(() => {
    if (data) {
      setFormData({
        po_number: data.po_number || '',
        date: data.date || new Date().toISOString().split('T')[0],
        delivery_date: data.delivery_date || '',
        supplier_name: data.supplier_name || '',
        company_name: data.company_name || 'My Company',
        currency: data.currency || 'USD',
        total_amount: data.total_amount || 0,
        status: data.status || 'Draft',
        items: (data.items || []).map(item => ({
          ...item,
          item_code: item.item_code || item.description?.replace(/\s+/g, '-').toUpperCase() || '',
          item_name: item.item_name || item.description || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          total: item.total || 0
        }))
      });
    }
  }, [data]);

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle item changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'unit_price' || field === 'total' 
        ? parseFloat(value) || 0 
        : value
    };

    // Recalculate total if quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    // Auto-generate item_code from description if not set
    if (field === 'description' && !updatedItems[index].item_code) {
      updatedItems[index].item_code = value.replace(/\s+/g, '-').toUpperCase().substring(0, 20);
      updatedItems[index].item_name = value;
    }

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Add item to the list
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        item_code: '',
        item_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0
      }]
    }));
  };

  // Remove item from the list
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Add status message
  const addStatusMessage = (message) => {
    setStatusMessages(prev => [...prev, { text: message, timestamp: new Date() }]);
  };

  // Validate form
  const validateForm = () => {
    if (!formData.supplier_name) {
      return 'Supplier name is required';
    }
    if (!formData.company_name) {
      return 'Company name is required';
    }
    if (!formData.date) {
      return 'Order date is required';
    }
    if (!formData.delivery_date) {
      return 'Delivery date is required';
    }
    
    // Validate delivery date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const orderDate = new Date(formData.date);
    const deliveryDate = new Date(formData.delivery_date);
    
    if (deliveryDate < today) {
      return 'Delivery date must be today or later';
    }
    
    if (deliveryDate < orderDate) {
      return 'Delivery date must be equal to or later than order date';
    }
    
    if (formData.items.length === 0) {
      return 'At least one item is required';
    }

    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.item_code) {
        return `Item ${i + 1}: Item code is required`;
      }
      if (!item.description && !item.item_name) {
        return `Item ${i + 1}: Description is required`;
      }
      if (!item.quantity || item.quantity <= 0) {
        return `Item ${i + 1}: Quantity must be greater than 0`;
      }
      if (item.unit_price < 0) {
        return `Item ${i + 1}: Unit price cannot be negative`;
      }
    }

    return null;
  };

  // Submit to ERPNext
  const handleSubmitToERPNext = async () => {
    // Reset states
    setError(null);
    setSuccess(null);
    setStatusMessages([]);
    setErpnextPONumber(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit to ERPNext
      const result = await submitPurchaseOrderToERPNext(formData, addStatusMessage);
      
      // Success
      setSuccess(`Purchase Order created and submitted successfully!`);
      setErpnextPONumber(result.po_name);
      
      // Call parent callback if needed
      if (onConfirm) {
        onConfirm({
          ...formData,
          erpnext_po_number: result.po_name,
          erpnext_po_data: result.po_data
        });
      }

    } catch (err) {
      setError(err.message || 'Failed to submit Purchase Order to ERPNext');
      addStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if field is empty/null
  const isEmptyField = (value) => {
    return value === null || value === '' || value === 0;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      'Approved': 'bg-green-100 text-green-800 border-green-300',
      'Rejected': 'bg-red-100 text-red-800 border-red-300',
      'Draft': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[status] || colors['Draft'];
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Order Form</h2>
          <div className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(formData.status)}`}>
            {formData.status}
          </div>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border-2 border-green-500 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-green-900">{success}</h3>
              {erpnextPONumber && (
                <div className="mt-2">
                  <p className="text-sm text-green-800">
                    ERPNext Purchase Order Number: <span className="font-mono font-bold">{erpnextPONumber}</span>
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    You can view this PO in ERPNext at: http://localhost:8080/app/purchase-order/{erpnextPONumber}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-red-900">Error</h3>
              <p className="mt-1 text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {statusMessages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Processing Status:</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {statusMessages.map((msg, index) => (
              <div key={index} className="text-sm text-blue-800 font-mono flex items-start">
                <span className="text-blue-400 mr-2">→</span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase Order Details Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplier_name}
              onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                isEmptyField(formData.supplier_name) ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter supplier name"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleFieldChange('company_name', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                isEmptyField(formData.company_name) ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="Enter company name"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                isEmptyField(formData.date) ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.delivery_date || ''}
              onChange={(e) => handleFieldChange('delivery_date', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                isEmptyField(formData.delivery_date) ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.currency || 'USD'}
              onChange={(e) => handleFieldChange('currency', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 ${
                isEmptyField(formData.currency) ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select Currency</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="INR">INR - Indian Rupee</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CHF">CHF - Swiss Franc</option>
              <option value="CNY">CNY - Chinese Yuan</option>
              <option value="ILS">ILS - Israeli Shekel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          <button
            onClick={handleAddItem}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
          >
            + Add Item
          </button>
        </div>
        
        {formData.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No items added yet. Click "Add Item" to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Code *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity *
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {formData.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.item_code || ''}
                        onChange={(e) => handleItemChange(index, 'item_code', e.target.value)}
                        disabled={isSubmitting}
                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="ITEM-001"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        disabled={isSubmitting}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                        placeholder="Item description"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        disabled={isSubmitting}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        disabled={isSubmitting}
                        className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-sm">{(item.total || 0).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleRemoveItem(index)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                        title="Remove item"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Submit to ERPNext</h3>
            <p className="text-sm text-gray-600 mt-1">
              This will create Company, Supplier, Items (if needed), and submit the Purchase Order to ERPNext
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitToERPNext}
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? 'Submitting...' : 'Submit to ERPNext'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrderForm;

