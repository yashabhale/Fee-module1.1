/**
 * Send WhatsApp message to parent's registered mobile number
 * @param {string} invoiceId - Invoice ID for the transaction
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendWhatsAppMessage = async (invoiceId) => {
  try {
    const response = await api.post(`/notifications/whatsapp`, { invoiceId });
    return { success: true, message: response.data?.message || 'WhatsApp message sent' };
  } catch (error) {
    return { success: false, message: error?.response?.data?.message || 'Failed to send WhatsApp message' };
  }
};

/**
 * Send SMS message to parent's registered mobile number
 * @param {string} invoiceId - Invoice ID for the transaction
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const sendSMSMessage = async (invoiceId) => {
  try {
    const response = await api.post(`/notifications/sms`, { invoiceId });
    return { success: true, message: response.data?.message || 'SMS sent' };
  } catch (error) {
    return { success: false, message: error?.response?.data?.message || 'Failed to send SMS' };
  }
};
import axios from 'axios'

// ==================== CONFIGURATION ====================

// Use environment variables with fallback for safety
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')

console.log('🔌 API Configuration:')
console.log('   Base URL:', API_BASE_URL)
console.log('   Timeout:', API_TIMEOUT, 'ms')

// Create axios instance with enhanced configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==================== REQUEST INTERCEPTOR ====================
api.interceptors.request.use(
  (config) => {
    // Log outgoing requests for debugging
    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)
    
    // Add timestamp to track request duration
    config.metadata = { startTime: Date.now() }
    
    // Add JWT token if available (for future authentication)
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request configuration error:', error)
    return Promise.reject(error)
  }
)

// ==================== RESPONSE INTERCEPTOR ====================
api.interceptors.response.use(
  (response) => {
    // Calculate and log response time
    const duration = Date.now() - response.config.metadata.startTime
    console.log(`✅ Response received (${duration}ms):`, response.status, response.statusText)
    return response
  },
  (error) => {
    // Enhanced error logging with full details
    console.error('❌ API Error Details:')
    
    if (error.response) {
      // Server responded with error status
      console.error('   Status:', error.response.status)
      console.error('   Status Text:', error.response.statusText)
      console.error('   Headers:', error.response.headers)
      console.error('   Data:', error.response.data)
      console.error('   URL:', error.response.config.url)
    } else if (error.request) {
      // Request made but no response received
      console.error('   No response received from server')
      console.error('   Request URL:', error.config?.url)
      console.error('   This usually means:')
      console.error('     - Backend server is not running')
      console.error('     - Server is on wrong port')
      console.error('     - CORS policy is blocking the request')
    } else {
      // Error in request setup
      console.error('   Message:', error.message)
    }
    
    console.error('   Full error:', error)
    return Promise.reject(error)
  }
)

// ==================== API CALLS ====================

/**
 * Fetch dashboard summary data (metrics from database)
 */
export const fetchDashboardStats = async () => {
  try {
    console.log('📊 Fetching dashboard stats from database...')
    const response = await api.get('/fee-payments/dashboard/stats')
    console.log('✅ Dashboard stats loaded successfully')
    return { success: true, data: response.data.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'dashboard stats')
    console.error('📊 Dashboard Stats Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch monthly collection data (from database)
 */
export const fetchMonthlyCollectionData = async (year = new Date().getFullYear()) => {
  try {
    console.log('📈 Fetching monthly collection data from database...')
    const response = await api.get(`/fee-payments/dashboard/monthly?year=${year}`)
    console.log('✅ Monthly collection data loaded successfully')
    return { success: true, data: response.data.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'monthly collection data')
    console.error('📈 Monthly Collection Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch payment method distribution (from database)
 */
export const fetchPaymentMethodData = async () => {
  try {
    console.log('💳 Fetching payment method distribution from database...')
    const response = await api.get('/transactions')
    console.log('✅ Payment method data loaded successfully')
    return { success: true, data: response.data.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'payment method data')
    console.error('💳 Payment Method Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch pending fees data (from database)
 */
export const fetchPendingFeesData = async (page = 1, limit = 100) => {
  try {
    console.log('⏳ Fetching pending fees from database...')
    const response = await api.get(`/fee-payments/pending?page=${page}&limit=${limit}`)
    console.log('✅ Pending fees loaded successfully')
    return { success: true, data: response.data.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'pending fees')
    console.error('⏳ Pending Fees Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch recent transactions (from database)
 * Calls the new endpoint /fee-payments/dashboard/recent-transactions
 */
export const fetchRecentTransactions = async (limit = 5) => {
  try {
    console.log('📋 Fetching recent transactions from database...')
    const response = await api.get(`/fee-payments/dashboard/recent-transactions?limit=${limit}`)
    console.log('✅ Recent transactions loaded successfully')
    return { success: true, data: response.data.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'recent transactions')
    console.error('📋 Recent Transactions Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch all transactions / payments
 */
export const fetchTransactions = async () => {
  try {
    console.log('💳 Fetching transactions...')
    const response = await api.get('/transactions')
    console.log('✅ Transactions loaded successfully')
    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'transactions')
    console.error('💳 Transactions Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch single invoice details
 */
export const fetchInvoiceDetails = async (invoiceId) => {
  try {
    console.log(`📋 Fetching invoice ${invoiceId}...`)
    const response = await api.get(`/invoice/${invoiceId}`)
    console.log('✅ Invoice details loaded successfully')
    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, `invoice ${invoiceId}`)
    console.error('📋 Invoice Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Process payment
 */
export const processPayment = async (invoiceId, amount, method) => {
  try {
    console.log(`💰 Processing payment: ${amount} via ${method}`)
    const response = await api.post('/payment', {
      invoiceId,
      amount,
      method,
    })
    console.log('✅ Payment processed successfully')
    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'payment')
    console.error('💰 Payment Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Fetch pending fees
 */
export const fetchPendingFees = async () => {
  try {
    console.log('⏳ Fetching pending fees...')
    const response = await api.get('/pending-fees')
    console.log('✅ Pending fees loaded successfully')
    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'pending fees')
    console.error('⏳ Pending Fees Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

/**
 * Health check - Test API connectivity
 */
export const healthCheck = async () => {
  try {
    console.log('🏥 Running health check...')
    const response = await api.get('/health')
    console.log('✅ Server is healthy')
    return { success: true, data: response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'health check')
    console.error('🏥 Health Check Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Format error message from axios error object
 * @param {Error} error - Axios error object
 * @param {string} context - Context of the error for better logging
 * @returns {string} Formatted error message
 */
function formatErrorMessage(error, context = 'API call') {
  if (error.response) {
    // Server responded with error status
    return `[${error.response.status}] ${error.response.statusText || 'Server Error'} - ${context}`
  } else if (error.request) {
    // Request made but no response
    return `Network Error - Backend server not responding. Check if server is running on ${API_BASE_URL.split('/api')[0]}`
  } else if (error.message === 'timeout of ' + API_TIMEOUT + 'ms exceeded') {
    return `Request Timeout - API took longer than ${API_TIMEOUT}ms to respond`
  } else {
    return error.message || `Unknown error during ${context}`
  }
}

/**
 * Test API connectivity - useful for debugging
 */
export const testConnection = async () => {
  console.log('🧪 Testing API connection...')
  console.log('   Backend URL:', API_BASE_URL)
  
  try {
    const health = await healthCheck()
    if (health.success) {
      console.log('✅ Connection successful!')
      return true
    } else {
      console.warn('⚠️ Connection test failed:', health.error)
      return false
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error)
    return false
  }
}

export default api
