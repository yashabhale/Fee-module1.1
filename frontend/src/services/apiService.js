import axios from 'axios'

// ==================== CONFIGURATION ====================

const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000')

console.log('🔌 API Configuration:')
console.log('   Base URL:', API_BASE_URL)
console.log('   Timeout:', API_TIMEOUT, 'ms')

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
    console.log(`📤 ${config.method.toUpperCase()} ${config.baseURL}${config.url}`)
    config.metadata = { startTime: Date.now() }
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
    const duration = Date.now() - response.config.metadata.startTime
    console.log(`✅ Response received (${duration}ms):`, response.status, response.statusText)
    return response
  },
  (error) => {
    console.error('❌ API Error Details:')
    if (error.response) {
      console.error('   Status:', error.response.status)
      console.error('   Status Text:', error.response.statusText)
      console.error('   Data:', error.response.data)
      console.error('   URL:', error.response.config.url)
    } else if (error.request) {
      console.error('   No response received from server')
      console.error('   Request URL:', error.config?.url)
    } else {
      console.error('   Message:', error.message)
    }
    console.error('   Full error:', error)
    return Promise.reject(error)
  }
)

// ==================== HELPER FUNCTIONS ====================

function formatErrorMessage(error, context = 'API call') {
  if (error.response) {
    return `[${error.response.status}] ${error.response.statusText || 'Server Error'} - ${context}`
  } else if (error.request) {
    return `Network Error - Backend server not responding. Check if server is running on ${API_BASE_URL.split('/api')[0]}`
  } else if (error.message === 'timeout of ' + API_TIMEOUT + 'ms exceeded') {
    return `Request Timeout - API took longer than ${API_TIMEOUT}ms to respond`
  } else {
    return error.message || `Unknown error during ${context}`
  }
}

// ==================== DASHBOARD API CALLS ====================

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

export const fetchPaymentMethodData = async () => {
  try {
    console.log('💳 Fetching payment method distribution from database...')
    const response = await api.get('/fee-payments/dashboard/stats')
    console.log('✅ Payment method data loaded successfully')
    return { success: true, data: response.data.data?.byPaymentMethod || [] }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'payment method data')
    console.error('💳 Payment Method Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

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

export const fetchTransactions = async () => {
  try {
    console.log('💳 Fetching all transactions...')
    const response = await api.get('/invoices')
    console.log('✅ Transactions loaded successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'transactions')
    console.error('💳 Transactions Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

// ==================== INVOICE API CALLS ====================

export const fetchInvoiceDetails = async (invoiceId) => {
  try {
    console.log(`📋 Fetching invoice ${invoiceId}...`)
    const response = await api.get(`/invoices/${invoiceId}`)
    console.log('✅ Invoice details loaded successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, `invoice ${invoiceId}`)
    console.error('📋 Invoice Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

// ==================== PAYMENT API CALLS ====================

export const createRazorpayOrder = async (amount, invoiceId) => {
  try {
    console.log(`💳 Creating Razorpay order for amount: ${amount}`)
    const response = await api.post('/payments/razorpay/create-order', {
      amount,
      invoiceId,
      currency: 'INR',
    })
    console.log('✅ Razorpay order created successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'Razorpay order creation')
    console.error('💳 Razorpay Order Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const verifyRazorpayPayment = async (paymentData) => {
  try {
    console.log('🔒 Verifying Razorpay payment...')
    const response = await api.post('/payments/razorpay/verify', paymentData)
    console.log('✅ Razorpay payment verified successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'Razorpay payment verification')
    console.error('🔒 Razorpay Verification Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const recordPayment = async (invoiceId, amount, paymentMethod, transactionId, notes) => {
  try {
    console.log(`💰 Recording payment: ${amount} via ${paymentMethod}`)
    const response = await api.post(`/payments/${invoiceId}/record`, {
      amount,
      paymentMethod,
      transactionId,
      notes,
    })
    console.log('✅ Payment recorded successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'payment recording')
    console.error('💰 Payment Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const getPaymentHistory = async (invoiceId) => {
  try {
    console.log(`📋 Fetching payment history for ${invoiceId}...`)
    const response = await api.get(`/payments/${invoiceId}/history`)
    console.log('✅ Payment history loaded successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'payment history')
    console.error('📋 Payment History Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

// ==================== NOTIFICATION API CALLS ====================

export const sendWhatsAppMessage = async (invoiceId) => {
  try {
    const response = await api.post('/notifications/whatsapp', { invoiceId })
    return { success: true, message: response.data?.message || 'WhatsApp message sent', data: response.data.data }
  } catch (error) {
    return { success: false, message: error?.response?.data?.message || 'Failed to send WhatsApp message' }
  }
}

export const sendSMSMessage = async (invoiceId) => {
  try {
    const response = await api.post('/notifications/sms', { invoiceId })
    return { success: true, message: response.data?.message || 'SMS sent', data: response.data.data }
  } catch (error) {
    return { success: false, message: error?.response?.data?.message || 'Failed to send SMS' }
  }
}

// ==================== REFUND API CALLS ====================

export const fetchRefundById = async (refundId) => {
  try {
    console.log(`📋 Fetching refund ${refundId}...`)
    const response = await api.get(`/refunds/${refundId}`)
    console.log('✅ Refund details loaded successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, `refund ${refundId}`)
    console.error('📋 Refund Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

// ==================== BULK UPLOAD API CALLS ====================

export const uploadBulkFile = async (uploadType, file) => {
  try {
    console.log(`📤 Uploading ${uploadType} file: ${file.name}`)
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(`/bulk-upload/${uploadType}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log(`✅ ${uploadType} uploaded successfully`)
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, `${uploadType} upload`)
    console.error(`📤 ${uploadType} Upload Error:`, errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const getBulkUploadLogs = async (page = 1, limit = 10) => {
  try {
    console.log('📋 Fetching bulk upload logs...')
    const response = await api.get(`/bulk-upload/logs?page=${page}&limit=${limit}`)
    console.log('✅ Upload logs loaded successfully')
    return { success: true, data: response.data.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'upload logs')
    console.error('📋 Upload Logs Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

// ==================== HEALTH CHECK ====================

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

// ==================== AUTHENTICATION ENDPOINTS ====================

export const loginUser = async (email, password) => {
  try {
    console.log('🔐 Attempting login...')
    const response = await api.post('/auth/login', { email, password })
    const { user, token, expiresIn } = response.data.data || response.data
    console.log('✅ Login successful')
    return { success: true, user, token, expiresIn }
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Login failed. Please check your credentials.'
    console.error('🔐 Login Error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

export const logoutUser = async () => {
  try {
    console.log('🚪 Logging out...')
    await api.post('/auth/logout')
    console.log('✅ Logout successful')
    return { success: true }
  } catch (error) {
    console.warn('🚪 Logout warning:', error.message)
    return { success: true }
  }
}

export const getCurrentUser = async () => {
  try {
    console.log('👤 Fetching current user...')
    const response = await api.get('/auth/me')
    console.log('✅ Current user fetched')
    return { success: true, user: response.data.data || response.data }
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Failed to fetch user'
    console.error('👤 Get User Error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

export const refreshToken = async (refreshToken) => {
  try {
    console.log('🔄 Refreshing token...')
    const response = await api.post('/auth/refresh-token', { refreshToken })
    const { token, expiresIn } = response.data.data || response.data
    console.log('✅ Token refreshed')
    return { success: true, token, expiresIn }
  } catch (error) {
    const errorMessage = error?.response?.data?.message || 'Failed to refresh token'
    console.error('🔄 Refresh Token Error:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

// ==================== REFUND MANAGEMENT ====================

export const createRefundRequest = async (refundData) => {
  try {
    console.log('💰 Submitting refund request...')
    console.log('   Refund data:', refundData)
    const response = await api.post('/refunds', refundData)
    console.log('✅ Refund request submitted successfully')
    console.log('   Response:', response.data)
    return {
      success: true,
      data: response.data?.data || response.data,
      message: response.data?.message || 'Refund request submitted successfully'
    }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'refund request submission')
    console.error('💰 Refund Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const fetchRefundRequests = async (filters = {}) => {
  try {
    console.log('📋 Fetching refund requests...')
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.student) params.append('student', filters.student)
    if (filters.page) params.append('page', filters.page)
    if (filters.limit) params.append('limit', filters.limit)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    const response = await api.get(`/refunds${queryString}`)
    console.log('✅ Refund requests loaded successfully')
    return { success: true, data: response.data?.data || response.data }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'refund requests')
    console.error('📋 Refund Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const approveRefundRequest = async (refundId, approvalData = {}) => {
  try {
    console.log(`💰 Approving refund request ${refundId}...`)
    const response = await api.post(`/refunds/${refundId}/approve`, approvalData)
    console.log('✅ Refund request approved successfully')
    return { success: true, data: response.data?.data || response.data, message: response.data?.message || 'Refund request approved' }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'refund approval')
    console.error('💰 Refund Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const rejectRefundRequest = async (refundId, rejectionReason) => {
  try {
    console.log(`💰 Rejecting refund request ${refundId}...`)
    const response = await api.post(`/refunds/${refundId}/reject`, { rejectionReason })
    console.log('✅ Refund request rejected successfully')
    return { success: true, data: response.data?.data || response.data, message: response.data?.message || 'Refund request rejected' }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'refund rejection')
    console.error('💰 Refund Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

export const processRefund = async (refundId, refundData) => {
  try {
    console.log(`💰 Processing refund request ${refundId}...`)
    const response = await api.post(`/refunds/${refundId}/process`, refundData)
    console.log('✅ Refund processed successfully')
    return { success: true, data: response.data?.data || response.data, message: response.data?.message || 'Refund processed' }
  } catch (error) {
    const errorMessage = formatErrorMessage(error, 'refund processing')
    console.error('💰 Refund Error:', errorMessage)
    return { success: false, error: errorMessage, details: error }
  }
}

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
