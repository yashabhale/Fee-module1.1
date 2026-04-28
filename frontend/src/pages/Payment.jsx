import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Shield, CreditCard, Building2, QrCode, ChevronRight, AlertCircle } from 'lucide-react'
import { getInvoiceById, generateTransactionId } from '../data/invoiceData'

const Payment = () => {
  const { invoiceId } = useParams()
  const navigate = useNavigate()

  const [invoice] = useState(() => getInvoiceById(invoiceId))
  const [selectedMethod, setSelectedMethod] = useState('razorpay')
  const [processing, setProcessing] = useState(false)
  const [formError, setFormError] = useState('')

  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      icon: <CreditCard size={20} />,
      description: 'UPI, Cards, Net Banking',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: <Building2 size={20} />,
      description: 'International Cards',
    },
    {
      id: 'upi',
      name: 'UPI Direct',
      icon: <QrCode size={20} />,
      description: 'Google Pay, PhonePe, Paytm',
    }
  ]

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  if (!invoice) {
    return (
      <div className="page">
        <div className="card">
          <div className="card-body text-center">
            <AlertCircle size={40} style={{ color: 'var(--red)', marginBottom: '16px' }} />
            <h2 className="card-title">Invoice Not Found</h2>
            <p className="text-muted mb-4">The invoice {invoiceId} does not exist.</p>
            <button onClick={() => navigate('/fees')} className="btn btn-primary">
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handlePayment = async () => {
    setProcessing(true)
    setFormError('')

    setTimeout(() => {
      sessionStorage.setItem(
        'paymentData',
        JSON.stringify({
          invoiceId,
          amount: invoice.totalAmount,
          transactionId: generateTransactionId(),
          paymentMethod: selectedMethod
        })
      )
      navigate('/payment-success')
    }, 1500)
  }

  return (
    <div className="page">
      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate('/fees')}>
        <ArrowLeft size={20} />
        <span>Back to Dashboard</span>
      </button>

      {/* Main Payment Container */}
      <div className="payment-container">
        
        {/* Left Side - Payment Summary */}
        <div className="payment-summary-card">
          <div className="card-header">
            <h3 className="card-title">Payment Summary</h3>
          </div>

          <div className="card-body">
            <div className="summary-row">
              <span className="text-muted">Invoice ID</span>
              <span className="td-mono">{invoice.invoiceId}</span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Student Name</span>
              <span className="font-semibold">{invoice.studentName}</span>
            </div>
            <div className="summary-row">
              <span className="text-muted">Class</span>
              <span className="font-semibold">{invoice.class}</span>
            </div>
            <div className="divider"></div>
            <div className="summary-row amount-row">
              <span className="text-muted">Amount Due</span>
              <span className="stat-value" style={{ fontSize: '24px' }}>₹{invoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-footer">
            <Shield size={14} />
            <span>Secured by 256-bit encryption</span>
          </div>
        </div>

        {/* Right Side - Payment Methods */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Select Payment Method</h3>
          </div>

          <div className="card-body">
            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`payment-method-item ${selectedMethod === method.id ? 'selected' : ''}`}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <div className="method-radio">
                    <div className={`radio-circle ${selectedMethod === method.id ? 'checked' : ''}`}>
                      {selectedMethod === method.id && <div className="radio-dot"></div>}
                    </div>
                  </div>
                  <div className="method-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                    {method.icon}
                  </div>
                  <div className="method-info">
                    <div className="method-name">{method.name}</div>
                    <div className="method-description">{method.description}</div>
                  </div>
                  <ChevronRight size={16} className="method-arrow" />
                </div>
              ))}
            </div>

            {/* Selected Method Details */}
            {selectedMethod === 'upi' && (
              <div className="method-details">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter your UPI ID (e.g., name@okhdfcbank)"
                />
                <button className="btn btn-outline">Verify</button>
              </div>
            )}

            {selectedMethod === 'razorpay' && (
              <div className="method-info-text">
                <p>Pay securely via UPI, Credit/Debit Cards, or Net Banking</p>
              </div>
            )}

            {selectedMethod === 'stripe' && (
              <div className="method-info-text">
                <p>Pay using international credit/debit cards</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="payment-actions">
              <button 
                className="btn btn-primary w-full"
                onClick={handlePayment}
                disabled={processing}
                style={{ padding: '12px 24px', fontSize: '15px' }}
              >
                {processing ? 'Processing...' : `Pay ₹${invoice.totalAmount.toLocaleString()}`}
              </button>
            </div>

            {/* Security Footer */}
            <div className="security-footer">
              <Lock size={14} />
              <div>
                <div className="security-title">Secure Payment</div>
                <div className="security-text">
                  Your payment information is encrypted and secure. We do not store your card details.
                  All transactions are processed through certified payment gateways compliant with PCI DSS standards.
                </div>
              </div>
            </div>

            {formError && (
              <div className="info-box info-box-red mt-3">
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Payment