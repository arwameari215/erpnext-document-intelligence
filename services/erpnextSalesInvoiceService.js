/**
 * ERPNext Sales Invoice Service
 * 
 * Handles communication with backend API (localhost:8000) which manages ERPNext integration.
 * Backend handles authentication, create-if-not-exists pattern, and all ERPNext workflows.
 */

// Use relative URLs - Next.js rewrites will proxy to backend
const BACKEND_API_URL = '';

/**
 * Generic API request handler for backend
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const url = `${BACKEND_API_URL}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    // Parse response
    const data = await response.json();

    // Check for errors
    if (!response.ok) {
      const errorMessage = data.error || data.message || 'Unknown error';
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error.message && !error.message.includes('Failed to fetch')) {
      throw error;
    }
    
    // Provide more specific error messages for connection failures
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error(`Cannot connect to backend API. Please ensure the backend server is running on port 8000.`);
    }
    
    throw new Error(`Network error: ${error.message}`);
  }
};

/**
 * Get Company details from ERPNext via Backend API
 */
export const getCompanyDetails = async (companyName) => {
  try {
    const response = await apiRequest(`/erpnext/company/${encodeURIComponent(companyName)}`);
    if (response && response.success && response.data) {
      return response.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Submit Sales Invoice to ERPNext via Backend API
 * 
 * Backend handles the complete workflow:
 * 1. Validate input
 * 2. Ensure Company exists (create if not)
 * 3. Ensure Customer exists (create if not)
 * 4. Ensure all Items exist (create each if not)
 * 5. Create Sales Invoice
 * 6. Submit Sales Invoice
 * 
 * @param {object} formData - Form data from UI
 * @param {function} onStatus - Callback for status updates
 * @returns {Promise<object>} Final Sales Invoice data
 */
export const submitSalesInvoiceToERPNext = async (formData, onStatus) => {
  try {
    // Validate input (basic client-side validation)
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

    // Prepare payload for backend
    const payload = {
      company_name: formData.company_name,
      customer_name: formData.customer_name,
      posting_date: formData.posting_date,
      due_date: formData.due_date,
      currency: formData.currency || 'USD',
      shipping_cost: parseFloat(formData.shipping_cost) || 0,
      items: formData.items.map(item => ({
        item_code: item.item_code || item.category,
        description: item.description,
        qty: parseFloat(item.quantity) || parseFloat(item.qty) || 1,
        rate: parseFloat(item.rate) || parseFloat(item.unit_price) || 0
      }))
    };

    // Call backend API - it handles entire workflow
    const response = await apiRequest('/erpnext/sales-invoice', 'POST', payload);

    // Process status log if callback provided
    if (onStatus && response.status_log) {
      response.status_log.forEach(message => onStatus(message));
    }

    return {
      success: true,
      invoice_name: response.invoice_name,
      invoice_data: response.invoice_data
    };

  } catch (error) {
    // Return friendly error message
    throw new Error(error.message);
  }
};

/**
 * Test ERPNext connection via Backend API
 */
export const testERPNextConnection = async () => {
  try {
    const response = await apiRequest('/erpnext/test-connection');
    return { success: response.success, message: response.message };
  } catch (error) {
    return { success: false, message: 'Unable to connect to ERPNext. Please check credentials.' };
  }
};

export default {
  getCompanyDetails,
  submitSalesInvoiceToERPNext,
  testERPNextConnection
};
