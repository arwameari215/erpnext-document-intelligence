import React, { useState, useEffect } from 'react';

function PurchaseOrderForm({ data, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    po_number: '',
    date: '',
    delivery_date: '',
    supplier_name: '',
    company_name: '',
    total_amount: 0,
    status: '',
    items: []
  });

  // Initialize form data from API response
  useEffect(() => {
    if (data) {
      setFormData({
        po_number: data.po_number || '',
        date: data.date || '',
        delivery_date: data.delivery_date || '',
        supplier_name: data.supplier_name || '',
        company_name: data.company_name || '',
        total_amount: data.total_amount || 0,
        status: data.status || 'Pending',
        items: data.items || []
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

    setFormData(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  // Validate and confirm
  const handleConfirm = () => {
    // Basic validation
    if (!formData.po_number) {
      alert('PO Number is required');
      return;
    }
    if (!formData.supplier_name) {
      alert('Supplier Name is required');
      return;
    }
    if (formData.items.length === 0) {
      alert('At least one item is required');
      return;
    }

    onConfirm(formData);
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
    return colors[status] || colors['Pending'];
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Purchase Order Preview</h2>
          <div className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(formData.status)}`}>
            {formData.status}
          </div>
        </div>
      </div>

      {/* Purchase Order Details Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Order Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PO Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PO Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.po_number}
              onChange={(e) => handleFieldChange('po_number', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.po_number) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter PO number"
            />
          </div>

          {/* Supplier Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supplier Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.supplier_name}
              onChange={(e) => handleFieldChange('supplier_name', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.supplier_name) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter supplier name"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Delivery Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Date
            </label>
            <input
              type="date"
              value={formData.delivery_date || ''}
              onChange={(e) => handleFieldChange('delivery_date', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.delivery_date) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
            />
            {isEmptyField(formData.delivery_date) && (
              <p className="text-xs text-yellow-600 mt-1">No delivery date extracted</p>
            )}
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => handleFieldChange('company_name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter company name"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="Draft">Draft</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Total Amount */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.total_amount}
              onChange={(e) => handleFieldChange('total_amount', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold text-lg"
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unit_price || ''}
                      onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.total || ''}
                      onChange={(e) => handleItemChange(index, 'total', e.target.value)}
                      className="w-28 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Future: Add/Remove Items */}
        <div className="mt-4 text-sm text-gray-500">
          {/* Placeholder for future Add/Remove item functionality */}
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to confirm?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review all fields and click confirm to prepare data for ERPNext upload
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseOrderForm;
