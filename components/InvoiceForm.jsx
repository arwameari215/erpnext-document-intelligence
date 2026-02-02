'use client';

import React, { useState, useEffect } from 'react';
import { submitSalesInvoiceToERPNext, getCompanyDetails } from '../services/erpnextSalesInvoiceService';

function InvoiceForm({ data, onConfirm, onCancel }) {
  const [formData, setFormData] = useState({
    InvoiceId: '',
    VendorName: '',
    InvoiceDate: '',
    DueDate: '',
    BillingAddressRecipient: '',
    ShippingAddress: '',
    CompanyName: '',
    Currency: 'USD',
    SubTotal: 0,
    ShippingCost: 0,
    Tax: 0,
    InvoiceTotal: 0,
    Items: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessages, setStatusMessages] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [erpnextInvoiceNumber, setErpnextInvoiceNumber] = useState(null);
  const [companyCurrency, setCompanyCurrency] = useState('USD');
  const [currencyWarning, setCurrencyWarning] = useState(null);
  const [extractedCurrency, setExtractedCurrency] = useState(null);

  // Initialize form data from API response
  useEffect(() => {
    if (data && data.data) {
      const invoiceDate = data.data.InvoiceDate || new Date().toISOString().split('T')[0];
      const dueDate = data.data.DueDate || new Date().toISOString().split('T')[0];
      const extractedCurr = data.data.Currency || null;
      setExtractedCurrency(extractedCurr);
      
      setFormData({
        InvoiceId: data.data.InvoiceId || '',
        VendorName: data.data.VendorName || '',
        InvoiceDate: invoiceDate,
        DueDate: dueDate,
        BillingAddressRecipient: data.data.BillingAddressRecipient || '',
        ShippingAddress: data.data.ShippingAddress || '',
        CompanyName: 'My Company', // Default company
        Currency: 'USD', // Will be set from company
        SubTotal: data.data.SubTotal || 0,
        ShippingCost: data.data.ShippingCost || 0,
        Tax: data.data.Tax || 0,
        InvoiceTotal: data.data.InvoiceTotal || 0,
        Items: (data.data.Items || []).map(item => ({
          ...item,
          item_code: item.category || item.description?.replace(/\s+/g, '-').toUpperCase().substring(0, 20) || '',
          item_name: item.description || ''
        }))
      });
      
      // Fetch company currency
      fetchCompanyCurrency('My Company', extractedCurr);
    }
  }, [data]);

  // Fetch company currency from ERPNext
  const fetchCompanyCurrency = async (companyName, extractedCurr) => {
    try {
      const companyDetails = await getCompanyDetails(companyName);
      if (companyDetails && companyDetails.default_currency) {
        const companyCurr = companyDetails.default_currency;
        setCompanyCurrency(companyCurr);
        
        // Update form currency to company currency
        setFormData(prev => ({
          ...prev,
          Currency: companyCurr
        }));
        
        // Check if extracted currency matches company currency
        if (extractedCurr && extractedCurr !== companyCurr) {
          setCurrencyWarning(
            `Invoice currency (${extractedCurr}) doesn't match company currency (${companyCurr}). ` +
            `The invoice will be created in ${companyCurr} as required by ERPNext.`
          );
        } else {
          setCurrencyWarning(null);
        }
      }
    } catch (error) {
      console.error('Error fetching company currency:', error);
    }
  };

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Fetch company currency when company name changes
    if (field === 'CompanyName' && value) {
      fetchCompanyCurrency(value, extractedCurrency);
    }
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

    // Auto-generate item_code from category or description
    if ((field === 'category' || field === 'description') && !updatedItems[index].item_code) {
      const codeSource = field === 'category' ? value : (updatedItems[index].category || value);
      updatedItems[index].item_code = codeSource.replace(/\s+/g, '-').toUpperCase().substring(0, 20);
    }

    // Calculate new subtotal and total
    const newSubTotal = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const newTotal = newSubTotal + (formData.ShippingCost || 0) + (formData.Tax || 0);

    setFormData(prev => ({
      ...prev,
      Items: updatedItems,
      SubTotal: newSubTotal,
      InvoiceTotal: newTotal
    }));
  };

  // Recalculate totals when shipping cost or tax changes
  const recalculateTotals = (shippingCost, tax, items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return subtotal + (shippingCost || 0) + (tax || 0);
  };

  // Override field change to recalculate totals for shipping/tax
  const handleFieldChangeWithTotal = (field, value) => {
    if (field === 'ShippingCost' || field === 'Tax') {
      const numValue = parseFloat(value) || 0;
      const newShipping = field === 'ShippingCost' ? numValue : formData.ShippingCost;
      const newTax = field === 'Tax' ? numValue : formData.Tax;
      const newTotal = recalculateTotals(newShipping, newTax, formData.Items);
      
      setFormData(prev => ({
        ...prev,
        [field]: numValue,
        InvoiceTotal: newTotal
      }));
    } else {
      handleFieldChange(field, value);
    }
  };

  // Add item to the list
  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      Items: [...prev.Items, {
        description: '',
        category: '',
        item_code: '',
        item_name: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }));
  };

  // Remove item from the list
  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      Items: prev.Items.filter((_, i) => i !== index)
    }));
  };

  // Add status message
  const addStatusMessage = (message) => {
    setStatusMessages(prev => [...prev, { text: message, timestamp: new Date() }]);
  };

  // Submit to ERPNext
  const handleSubmitToERPNext = async () => {
    // Reset states
    setError(null);
    setSuccess(null);
    setStatusMessages([]);
    setErpnextInvoiceNumber(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for ERPNext
      const erpnextData = {
        customer_name: formData.BillingAddressRecipient || formData.VendorName,
        company_name: formData.CompanyName,
        posting_date: formData.InvoiceDate,
        due_date: formData.DueDate,
        currency: formData.Currency,
        shipping_cost: formData.ShippingCost,
        items: formData.Items
      };

      // Submit to ERPNext
      const result = await submitSalesInvoiceToERPNext(erpnextData, addStatusMessage);
      
      // Success
      setSuccess(`Sales Invoice created and submitted successfully!`);
      setErpnextInvoiceNumber(result.invoice_name);
      
      // Call parent callback if needed
      if (onConfirm) {
        onConfirm({
          ...formData,
          erpnext_invoice_number: result.invoice_name,
          erpnext_invoice_data: result.invoice_data
        });
      }

    } catch (err) {
      setError(err.message || 'Failed to submit Sales Invoice to ERPNext');
      addStatusMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.VendorName && !formData.BillingAddressRecipient) {
      return 'Please select a customer before creating the invoice.';
    }
    if (!formData.CompanyName) {
      return 'Please specify a company before creating the invoice.';
    }
    if (!formData.InvoiceDate) {
      return 'Invoice date is required.';
    }
    if (!formData.DueDate) {
      return 'Due date is required.';
    }

    // Validate dates
    const invoiceDate = new Date(formData.InvoiceDate);
    const dueDate = new Date(formData.DueDate);
    
    if (dueDate < invoiceDate) {
      return 'Due date cannot be earlier than invoice date.';
    }

    if (formData.Items.length === 0) {
      return 'An invoice must include at least one item.';
    }

    // Validate each item
    for (let i = 0; i < formData.Items.length; i++) {
      const item = formData.Items[i];
      if (!item.item_code && !item.category) {
        return `Item ${i + 1}: Item code or category is required`;
      }
      if (!item.description) {
        return `Item ${i + 1}: Description is required`;
      }
      if (!item.quantity || item.quantity <= 0) {
        return `Item ${i + 1}: Quantity must be greater than zero`;
      }
      if (item.rate < 0) {
        return `Item ${i + 1}: Rate cannot be negative`;
      }
    }

    // Validate shipping cost
    if (formData.ShippingCost < 0) {
      return 'Shipping cost cannot be negative.';
    }

    return null;
  };

  // Validate and confirm (legacy - for non-ERPNext flow)
  const handleConfirm = () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
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
      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-green-800 font-medium">{success}</p>
          </div>
          {erpnextInvoiceNumber && (
            <p className="text-green-700 mt-2 ml-7">
              ERPNext Sales Invoice Number: <span className="font-semibold">{erpnextInvoiceNumber}</span>
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {statusMessages.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Processing Status:</h3>
          <div className="space-y-1">
            {statusMessages.map((msg, idx) => (
              <p key={idx} className="text-blue-800 text-sm">{msg.text}</p>
            ))}
          </div>
        </div>
      )}

      {/* Currency Warning */}
      {currencyWarning && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-orange-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-orange-800">{currencyWarning}</p>
          </div>
        </div>
      )}

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

          {/* Vendor Name / Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.VendorName}
              onChange={(e) => handleFieldChange('VendorName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.VendorName) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter customer name"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.CompanyName}
              onChange={(e) => handleFieldChange('CompanyName', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.CompanyName) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
              placeholder="Enter company name"
            />
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.Currency}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Currency is set by the company in ERPNext and cannot be changed</p>
            {extractedCurrency && extractedCurrency !== formData.Currency && (
              <p className="text-xs text-orange-600 mt-1">
                Note: Extracted currency was {extractedCurrency}
              </p>
            )}
          </div>

          {/* Invoice Date / Posting Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invoice Date (Posting Date) <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.InvoiceDate}
              onChange={(e) => handleFieldChange('InvoiceDate', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.InvoiceDate) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
            />
          </div>

          {/* Payment Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Due Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.DueDate}
              onChange={(e) => handleFieldChange('DueDate', e.target.value)}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                isEmptyField(formData.DueDate) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'
              }`}
            />
            <p className="text-xs text-gray-500 mt-1">Payment due date must be on or after the invoice date</p>
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
              Subtotal ({formData.Currency})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.SubTotal}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Calculated automatically from all items</p>
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
              onChange={(e) => handleFieldChangeWithTotal('ShippingCost', e.target.value)}
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
              onChange={(e) => handleFieldChangeWithTotal('Tax', e.target.value)}
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
              Invoice Total ({formData.Currency})
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.InvoiceTotal}
              readOnly
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Calculated automatically from items + shipping + tax</p>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
          <button
            type="button"
            onClick={handleAddItem}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            + Add Item
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category / Item Code
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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                      disabled={isSubmitting}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                      placeholder="Item description"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.category || item.item_code || ''}
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                      placeholder="Category"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="1"
                      value={item.quantity || ''}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      disabled={isSubmitting}
                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      disabled={isSubmitting}
                      className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount || ''}
                      readOnly
                      disabled
                      className="w-24 px-2 py-1 border border-gray-300 rounded bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      disabled={isSubmitting || formData.Items.length === 1}
                      className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ready to submit?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Review all fields and submit the Sales Invoice to ERPNext. This will create a Customer, Company, Items, and Sales Invoice in ERPNext.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitToERPNext}
              disabled={isSubmitting}
              className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit to ERPNext'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvoiceForm;
