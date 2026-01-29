import React, { useState, useEffect } from 'react';

function InvoiceForm({ data, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    InvoiceId: '',
    VendorName: '',
    InvoiceDate: '',
    BillingAddressRecipient: '',
    ShippingAddress: '',
    SubTotal: 0,
    ShippingCost: 0,
    Tax: 0,
    InvoiceTotal: 0,
    Items: []
  });

  // Initialize form data from API response
  useEffect(() => {
    if (data && data.data) {
      setFormData({
        InvoiceId: data.data.InvoiceId || '',
        VendorName: data.data.VendorName || '',
        InvoiceDate: data.data.InvoiceDate || '',
        BillingAddressRecipient: data.data.BillingAddressRecipient || '',
        ShippingAddress: data.data.ShippingAddress || '',
        SubTotal: data.data.SubTotal || 0,
        ShippingCost: data.data.ShippingCost || 0,
        Tax: data.data.Tax || 0,
        InvoiceTotal: data.data.InvoiceTotal || 0,
        Items: data.data.Items || []
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
    const updatedItems = [...formData.Items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'quantity' || field === 'rate' || field === 'amount' 
        ? parseFloat(value) || 0 
        : value
    };

    // Recalculate amount if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }

    setFormData(prev => ({
      ...prev,
      Items: updatedItems
    }));
  };

  // Validate and confirm
  const handleConfirm = () => {
    // Basic validation
    if (!formData.InvoiceId) {
      alert('Invoice ID is required');
      return;
    }
    if (!formData.VendorName) {
      alert('Vendor Name is required');
      return;
    }
    if (formData.Items.length === 0) {
      alert('At least one item is required');
      return;
    }

    onConfirm(formData);
  };

  // Check if field is empty/null
  const isEmptyField = (value) => {
    return value === null || value === '' || value === 0;
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Extraction Confidence</div>
              <div className="text-lg font-semibold text-green-600">
                {(data.confidence * 100).toFixed(0)}%
              </div>
            </div>
            {data.predictionTime && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Processing Time</div>
                <div className="text-lg font-semibold text-gray-700">
                  {data.predictionTime.toFixed(2)}s
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Details Form */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Invoice ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.InvoiceId}
              onChange={(e) => handleFieldChange('InvoiceId', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.InvoiceId) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter invoice ID"
            />
          </div>

          {/* Vendor Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.VendorName}
              onChange={(e) => handleFieldChange('VendorName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.VendorName) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter vendor name"
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date
            </label>
            <input
              type="date"
              value={formData.InvoiceDate}
              onChange={(e) => handleFieldChange('InvoiceDate', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Billing Address Recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billing Address Recipient
            </label>
            <input
              type="text"
              value={formData.BillingAddressRecipient}
              onChange={(e) => handleFieldChange('BillingAddressRecipient', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter recipient name"
            />
          </div>

          {/* Shipping Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Address
            </label>
            <input
              type="text"
              value={formData.ShippingAddress}
              onChange={(e) => handleFieldChange('ShippingAddress', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter shipping address"
            />
          </div>

          {/* Subtotal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtotal
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.SubTotal}
              onChange={(e) => handleFieldChange('SubTotal', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Shipping Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shipping Cost
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.ShippingCost}
              onChange={(e) => handleFieldChange('ShippingCost', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Tax */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.Tax || ''}
              onChange={(e) => handleFieldChange('Tax', parseFloat(e.target.value) || 0)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.Tax) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter tax amount"
            />
            {isEmptyField(formData.Tax) && (
              <p className="text-xs text-yellow-600 mt-1">No tax amount extracted</p>
            )}
          </div>

          {/* Invoice Total */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Total
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.InvoiceTotal}
              onChange={(e) => handleFieldChange('InvoiceTotal', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold"
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
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {formData.Items.map((item, index) => (
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
                      type="text"
                      value={item.category || ''}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Category"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold"
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

export default InvoiceForm;
