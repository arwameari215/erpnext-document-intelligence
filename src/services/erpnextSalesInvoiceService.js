/**
 * ERPNext Sales Invoice Service
 * 
 * Handles direct communication with ERPNext REST API for Sales Invoices
 * Implements create-if-not-exists pattern for Customer, Company, Items
 * and Sales Invoice creation/submission
 */

const ERPNEXT_BASE_URL = import.meta.env.VITE_ERPNEXT_URL || '';
const API_KEY = import.meta.env.VITE_ERPNEXT_API_KEY;
const API_SECRET = import.meta.env.VITE_ERPNEXT_API_SECRET;

/**
 * Generate Authorization header for ERPNext API
 */
const getAuthHeaders = () => {
  if (!API_KEY || !API_SECRET) {
    throw new Error('ERPNext API credentials not configured. Please set VITE_ERPNEXT_API_KEY and VITE_ERPNEXT_API_SECRET in your .env file');
  }

  return {
    'Authorization': `token ${API_KEY}:${API_SECRET}`,
    'Content-Type': 'application/json',
  };
};

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const url = `${ERPNEXT_BASE_URL}${endpoint}`;
  
  const options = {
    method,
    headers: getAuthHeaders(),
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    // For 404, return null (entity not found)
    if (response.status === 404) {
      return null;
    }

    // Parse response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      let errorMessage = data.exception || data.message || data._server_messages || 'Unknown error';
      
      // Strip HTML tags from error message
      errorMessage = errorMessage.replace(/<[^>]*>/g, '');
      
      // Check for exchange rate errors
      if (errorMessage.toLowerCase().includes('exchange rate') || 
          errorMessage.toLowerCase().includes('currency exchange') ||
          errorMessage.toLowerCase().includes('conversion rate')) {
        throw new Error(`Exchange rate not configured in ERPNext. Please go to ERPNext → Setup → Currency Exchange and add the exchange rate for your selected currency.`);
      }
      
      throw new Error(`ERPNext API Error: ${errorMessage}`);
    }

    return data;
  } catch (error) {
    if (error.message.includes('ERPNext API Error')) {
      throw error;
    }
    
    // Provide more specific error messages
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to ERPNext at ${ERPNEXT_BASE_URL}. Please ensure ERPNext is running and accessible.`);
    }
    
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Generic create-if-not-exists pattern
 */
const ensureEntityExists = async (doctype, identifier, createPayload, onStatus) => {
  try {
    // Check if entity exists
    onStatus && onStatus(`Checking ${doctype}: ${identifier}...`);
    
    const existing = await apiRequest(`/api/resource/${doctype}/${encodeURIComponent(identifier)}`);
    
    if (existing && existing.data) {
      onStatus && onStatus(`${doctype} "${identifier}" already exists ✓`);
      return existing.data;
    }

    // Entity doesn't exist, create it
    onStatus && onStatus(`Creating ${doctype}: ${identifier}...`);
    
    const created = await apiRequest(`/api/resource/${doctype}`, 'POST', createPayload);
    
    if (created && created.data) {
      onStatus && onStatus(`${doctype} "${identifier}" created successfully ✓`);
      return created.data;
    }

    throw new Error(`Failed to create ${doctype}`);
  } catch (error) {
    throw new Error(`Error ensuring ${doctype} exists: ${error.message}`);
  }
};

/**
 * Get Company details from ERPNext
 */
export const getCompanyDetails = async (companyName) => {
  try {
    const response = await apiRequest(`/api/resource/Company/${encodeURIComponent(companyName)}`);
    if (response && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Ensure Company exists in ERPNext
 */
export const ensureCompany = async (companyName, onStatus) => {
  const payload = {
    company_name: companyName,
    abbr: companyName.substring(0, 3).toUpperCase(),
    default_currency: 'USD',
    country: 'United States'
  };

  return ensureEntityExists('Company', companyName, payload, onStatus);
};

/**
 * Ensure Customer exists in ERPNext
 */
export const ensureCustomer = async (customerName, onStatus) => {
  const payload = {
    customer_name: customerName,
    customer_type: 'Individual',
    customer_group: 'All Customer Groups',
    territory: 'All Territories'
  };

  return ensureEntityExists('Customer', customerName, payload, onStatus);
};

/**
 * Ensure Item exists in ERPNext
 */
export const ensureItem = async (itemCode, itemName, onStatus) => {
  const payload = {
    item_code: itemCode,
    item_name: itemName || itemCode,
    item_group: 'All Item Groups',
    stock_uom: 'Nos',
    is_stock_item: 0
  };

  return ensureEntityExists('Item', itemCode, payload, onStatus);
};

/**
 * Ensure multiple items exist
 */
export const ensureItems = async (items, onStatus) => {
  const results = [];
  
  for (const item of items) {
    try {
      const result = await ensureItem(
        item.item_code || item.category,
        item.item_name || item.description,
        onStatus
      );
      results.push(result);
    } catch (error) {
      throw new Error(`Failed to ensure item ${item.item_code || item.category}: ${error.message}`);
    }
  }
  
  return results;
};

/**
 * Create Sales Invoice in ERPNext
 */
export const createSalesInvoice = async (invoiceData, onStatus) => {
  onStatus && onStatus('Creating Sales Invoice...');

  const payload = {
    customer: invoiceData.customer_name,
    company: invoiceData.company_name,
    currency: invoiceData.currency || 'USD',
    posting_date: invoiceData.posting_date,
    due_date: invoiceData.due_date,
    ignore_pricing_rule: 1,
    items: invoiceData.items.map(item => ({
      item_code: item.item_code || item.category,
      qty: parseFloat(item.qty) || parseFloat(item.quantity) || 1,
      rate: parseFloat(item.rate) || parseFloat(item.unit_price) || 0
    }))
  };

  // Add shipping charges if present
  if (invoiceData.shipping_cost && parseFloat(invoiceData.shipping_cost) > 0) {
    payload.shipping_charges = parseFloat(invoiceData.shipping_cost);
  }

  try {
    const response = await apiRequest('/api/resource/Sales Invoice', 'POST', payload);
    
    if (response && response.data) {
      onStatus && onStatus(`Sales Invoice ${response.data.name} created successfully ✓`);
      return response.data;
    }

    throw new Error('Failed to create Sales Invoice');
  } catch (error) {
    // Translate to friendly error
    const message = error.message;
    if (message.includes('Mandatory field')) {
      throw new Error('Some invoice details are missing or invalid. Please check all required fields.');
    }
    if (message.includes('does not exist')) {
      throw new Error('Unable to create invoice. Please verify customer and company information.');
    }
    if (message.includes('exchange rate') || message.includes('Currency Exchange')) {
      throw new Error(
        `Exchange rate not configured in ERPNext for the selected currency. ` +
        `Please go to ERPNext → Setup → Currency Exchange and add the exchange rate for ${invoiceData.currency || 'the selected currency'}.`
      );
    }
    throw new Error(`Error creating Sales Invoice: ${error.message}`);
  }
};

/**
 * Submit Sales Invoice in ERPNext (change docstatus to 1)
 */
export const submitSalesInvoice = async (invoiceName, onStatus) => {
  onStatus && onStatus(`Submitting Sales Invoice ${invoiceName}...`);

  const payload = {
    docstatus: 1
  };

  try {
    const response = await apiRequest(`/api/resource/Sales Invoice/${encodeURIComponent(invoiceName)}`, 'PUT', payload);
    
    if (response && response.data) {
      onStatus && onStatus(`Sales Invoice ${invoiceName} submitted successfully ✓`);
      return response.data;
    }

    throw new Error('Failed to submit Sales Invoice');
  } catch (error) {
    throw new Error(`Error submitting Sales Invoice: ${error.message}`);
  }
};

/**
 * Complete Sales Invoice workflow
 * 
 * Orchestrates the entire process:
 * 1. Validate input
 * 2. Ensure Company exists
 * 3. Ensure Customer exists
 * 4. Ensure all Items exist
 * 5. Create Sales Invoice
 * 6. Submit Sales Invoice
 * 
 * @param {object} formData - Form data from UI
 * @param {function} onStatus - Callback for status updates
 * @returns {Promise<object>} Final Sales Invoice data
 */
export const submitSalesInvoiceToERPNext = async (formData, onStatus) => {
  try {
    // Validate input
    if (!formData.customer_name || formData.customer_name.trim() === '') {
      throw new Error('Please select a customer before creating the invoice.');
    }
    if (!formData.company_name || formData.company_name.trim() === '') {
      throw new Error('Please specify a company before creating the invoice.');
    }
    if (!formData.items || formData.items.length === 0) {
      throw new Error('An invoice must include at least one item.');
    }
    if (!formData.posting_date) {
      throw new Error('Invoice date is required.');
    }
    if (!formData.due_date) {
      throw new Error('Due date is required.');
    }

    // Validate dates
    const postingDate = new Date(formData.posting_date);
    const dueDate = new Date(formData.due_date);
    
    if (dueDate < postingDate) {
      throw new Error('Due date cannot be earlier than invoice date.');
    }

    // Validate each item
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      const itemNum = i + 1;
      
      if (!item.item_code && !item.category) {
        throw new Error(`Item ${itemNum}: Item code is required.`);
      }
      if (!item.description) {
        throw new Error(`Item ${itemNum}: Description is required.`);
      }
      
      const qty = parseFloat(item.quantity) || parseFloat(item.qty) || 0;
      if (qty <= 0) {
        throw new Error(`Item ${itemNum}: Quantity must be greater than zero.`);
      }
      
      const rate = parseFloat(item.rate) || parseFloat(item.unit_price) || 0;
      if (rate < 0) {
        throw new Error(`Item ${itemNum}: Rate cannot be negative.`);
      }
    }

    // Validate shipping cost
    const shippingCost = parseFloat(formData.shipping_cost) || 0;
    if (shippingCost < 0) {
      throw new Error('Shipping cost cannot be negative.');
    }

    // Step 1: Ensure Company exists
    await ensureCompany(formData.company_name, onStatus);

    // Step 2: Ensure Customer exists
    await ensureCustomer(formData.customer_name, onStatus);

    // Step 3: Ensure all Items exist
    await ensureItems(formData.items, onStatus);

    // Step 4: Create Sales Invoice
    const invoicePayload = {
      customer_name: formData.customer_name,
      company_name: formData.company_name,
      posting_date: formData.posting_date,
      due_date: formData.due_date,
      shipping_cost: shippingCost,
      items: formData.items
    };

    const createdInvoice = await createSalesInvoice(invoicePayload, onStatus);

    // Step 5: Submit Sales Invoice
    const submittedInvoice = await submitSalesInvoice(createdInvoice.name, onStatus);

    return {
      success: true,
      invoice_name: submittedInvoice.name,
      invoice_data: submittedInvoice
    };

  } catch (error) {
    // Return friendly error message
    throw new Error(error.message);
  }
};

/**
 * Test ERPNext connection
 */
export const testERPNextConnection = async () => {
  try {
    await apiRequest('/api/method/frappe.auth.get_logged_user');
    return { success: true, message: 'Connected to ERPNext successfully' };
  } catch (error) {
    return { success: false, message: 'Unable to connect to ERPNext. Please check credentials.' };
  }
};

export default {
  getCompanyDetails,
  ensureCompany,
  ensureCustomer,
  ensureItem,
  ensureItems,
  createSalesInvoice,
  submitSalesInvoice,
  submitSalesInvoiceToERPNext,
  testERPNextConnection
};
