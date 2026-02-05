/**
 * ERPNext Purchase Order Service
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
 * Submit Purchase Order to ERPNext via Backend API
 * 
 * Backend handles the complete workflow:
 * 1. Validate input
 * 2. Ensure Company exists (create if not)
 * 3. Ensure Supplier exists (create if not)
 * 4. Ensure all Items exist (create each if not)
 * 5. Create Purchase Order
 * 6. Submit Purchase Order
 * 
 * @param {object} formData - Form data from UI
 * @param {function} onStatus - Callback for status updates
 * @returns {Promise<object>} Final Purchase Order data
 */
export const submitPurchaseOrderToERPNext = async (formData, onStatus) => {
  try {
    // Validate input (basic client-side validation)
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

    // Prepare payload for backend
    const payload = {
      company_name: formData.company_name,
      supplier_name: formData.supplier_name,
      date: formData.date,
      delivery_date: formData.delivery_date,
      currency: formData.currency || 'USD',
      items: formData.items.map(item => ({
        item_code: item.item_code,
        item_name: item.item_name || item.description,
        qty: item.quantity,
        rate: item.unit_price
      }))
    };

    // Call backend API - it handles entire workflow
    const response = await apiRequest('/erpnext/purchase-order', 'POST', payload);

    // Process status log if callback provided
    if (onStatus && response.status_log) {
      response.status_log.forEach(message => onStatus(message));
    }

    return {
      success: true,
      po_name: response.po_name,
      po_data: response.po_data
    };

  } catch (error) {
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
    return { success: false, message: error.message };
  }
};

export default {
  submitPurchaseOrderToERPNext,
  testERPNextConnection
};
