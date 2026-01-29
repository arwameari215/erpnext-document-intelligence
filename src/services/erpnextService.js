/**
 * ERPNext Service
 * 
 * Handles direct communication with ERPNext REST API
 * Implements create-if-not-exists pattern for Company, Supplier, Items
 * and Purchase Order creation/submission
 */

// Use proxy in development, direct URL in production
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
      const errorMessage = data.exception || data.message || data._server_messages || 'Unknown error';
      
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
      throw new Error(`Cannot connect to ERPNext at ${ERPNEXT_BASE_URL}. Please ensure:\n1. ERPNext is running\n2. CORS is configured in ERPNext\n3. The URL is correct`);
    }
    
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Generic create-if-not-exists pattern
 * @param {string} doctype - ERPNext doctype (e.g., 'Company', 'Supplier')
 * @param {string} identifier - Unique identifier to check existence
 * @param {object} createPayload - Payload to create if not exists
 * @param {function} onStatus - Callback for status updates
 * @returns {Promise<object>} Existing or newly created entity
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
 * Ensure Supplier exists in ERPNext
 */
export const ensureSupplier = async (supplierName, onStatus) => {
  const payload = {
    supplier_name: supplierName,
    supplier_type: 'Company'
  };

  return ensureEntityExists('Supplier', supplierName, payload, onStatus);
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
        item.item_code,
        item.item_name || item.description,
        onStatus
      );
      results.push(result);
    } catch (error) {
      throw new Error(`Failed to ensure item ${item.item_code}: ${error.message}`);
    }
  }
  
  return results;
};

/**
 * Create Purchase Order in ERPNext
 */
export const createPurchaseOrder = async (purchaseOrderData, onStatus) => {
  onStatus && onStatus('Creating Purchase Order...');

  const payload = {
    supplier: purchaseOrderData.supplier_name,
    company: purchaseOrderData.company_name,
    currency: purchaseOrderData.currency || 'USD',
    transaction_date: purchaseOrderData.transaction_date,
    schedule_date: purchaseOrderData.schedule_date,
    items: purchaseOrderData.items.map(item => ({
      item_code: item.item_code,
      qty: parseFloat(item.qty) || parseFloat(item.quantity) || 1,
      rate: parseFloat(item.rate) || parseFloat(item.unit_price) || 0,
      warehouse: item.warehouse || 'Stores - MC'  // Add default warehouse for stock items
    }))
  };

  try {
    const response = await apiRequest('/api/resource/Purchase Order', 'POST', payload);
    
    if (response && response.data) {
      onStatus && onStatus(`Purchase Order ${response.data.name} created successfully ✓`);
      return response.data;
    }

    throw new Error('Failed to create Purchase Order');
  } catch (error) {
    throw new Error(`Error creating Purchase Order: ${error.message}`);
  }
};

/**
 * Submit Purchase Order in ERPNext (change docstatus to 1)
 */
export const submitPurchaseOrder = async (poName, onStatus) => {
  onStatus && onStatus(`Submitting Purchase Order ${poName}...`);

  const payload = {
    docstatus: 1
  };

  try {
    const response = await apiRequest(`/api/resource/Purchase Order/${encodeURIComponent(poName)}`, 'PUT', payload);
    
    if (response && response.data) {
      onStatus && onStatus(`Purchase Order ${poName} submitted successfully ✓`);
      return response.data;
    }

    throw new Error('Failed to submit Purchase Order');
  } catch (error) {
    throw new Error(`Error submitting Purchase Order: ${error.message}`);
  }
};

/**
 * Complete Purchase Order workflow
 * 
 * This is the main function that orchestrates the entire process:
 * 1. Ensure Company exists
 * 2. Ensure Supplier exists
 * 3. Ensure all Items exist
 * 4. Create Purchase Order
 * 5. Submit Purchase Order
 * 
 * @param {object} formData - Form data from UI
 * @param {function} onStatus - Callback for status updates
 * @returns {Promise<object>} Final Purchase Order data
 */
export const submitPurchaseOrderToERPNext = async (formData, onStatus) => {
  try {
    // Validate input
    if (!formData.company_name) {
      throw new Error('Company name is required');
    }
    if (!formData.supplier_name) {
      throw new Error('Supplier name is required');
    }
    if (!formData.items || formData.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (!formData.date || !formData.delivery_date) {
      throw new Error('Order date and delivery date are required');
    }

    // Step 1: Ensure Company exists
    await ensureCompany(formData.company_name, onStatus);

    // Step 2: Ensure Supplier exists
    await ensureSupplier(formData.supplier_name, onStatus);

    // Step 3: Ensure all Items exist
    await ensureItems(formData.items, onStatus);

    // Step 4: Create Purchase Order
    const purchaseOrderPayload = {
      supplier_name: formData.supplier_name,
      company_name: formData.company_name,
      currency: formData.currency || 'USD',
      transaction_date: formData.date,
      schedule_date: formData.delivery_date,
      items: formData.items
    };

    const createdPO = await createPurchaseOrder(purchaseOrderPayload, onStatus);

    // Step 5: Submit Purchase Order
    const submittedPO = await submitPurchaseOrder(createdPO.name, onStatus);

    return {
      success: true,
      po_name: submittedPO.name,
      po_data: submittedPO
    };

  } catch (error) {
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
    return { success: false, message: error.message };
  }
};

export default {
  ensureCompany,
  ensureSupplier,
  ensureItem,
  ensureItems,
  createPurchaseOrder,
  submitPurchaseOrder,
  submitPurchaseOrderToERPNext,
  testERPNextConnection
};
