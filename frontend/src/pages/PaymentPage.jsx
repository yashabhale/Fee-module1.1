import { useState } from 'react';
import RazorpayPaymentModal from './RazorpayPaymentModal';
import '../styles/payment-page.css';

/**
 * Sample Payment Page Component
 * Demonstrates how to use RazorpayPaymentModal
 */

function PaymentPage() {
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Sample fee data (would come from backend/database in real app)
  const feeData = {
    studentName: 'John Doe',
    studentId: 'STU001',
    amount: 5000, // ₹5000
    invoiceId: 'INV2024001',
    totalAmount: 10000, // Total fee
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('✅ Payment successful:', paymentData);
    setPaymentStatus('success');
    setPaymentDetails(paymentData);

    // TODO: In real app:
    // 1. Show success message
    // 2. Update fee status in database
    // 3. Send confirmation email
    // 4. Redirect to receipt/dashboard
  };

  const handlePaymentFailure = (error) => {
    console.error('❌ Payment failed:', error);
    setPaymentStatus('failure');
    setPaymentDetails(error);

    // TODO: In real app:
    // 1. Show error message
    // 2. Retry option
    // 3. Contact support
  };

  return (
    <div className="payment-page-container">
      <div className="payment-page-header">
        <h1>Fee Payment</h1>
        <p>Secure payment powered by Razorpay</p>
      </div>

      <div className="payment-page-content">
        {/* Fee Details Section */}
        <div className="fee-details-section">
          <h2>Fee Details</h2>
          <table className="fee-table">
            <tbody>
              <tr>
                <td>Student Name:</td>
                <td className="value">{feeData.studentName}</td>
              </tr>
              <tr>
                <td>Student ID:</td>
                <td className="value">{feeData.studentId}</td>
              </tr>
              <tr>
                <td>Total Fee:</td>
                <td className="value">₹{parseFloat(feeData.totalAmount).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Amount Due:</td>
                <td className="value highlight">₹{parseFloat(feeData.amount).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Invoice ID:</td>
                <td className="value">{feeData.invoiceId}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Status Section */}
        {paymentStatus && (
          <div className={`payment-status payment-status-${paymentStatus}`}>
            {paymentStatus === 'success' ? (
              <div className="success-message">
                <h3>✅ Payment Successful!</h3>
                <p>Your payment has been verified and recorded.</p>
                <div className="success-details">
                  <p>
                    <strong>Payment ID:</strong> {paymentDetails.paymentId}
                  </p>
                  <p>
                    <strong>Amount:</strong> ₹{parseFloat(paymentDetails.amount).toFixed(2)}
                  </p>
                  <p>
                    <strong>Status:</strong>{' '}
                    {paymentDetails.verificationResponse?.data?.status || 'Captured'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="failure-message">
                <h3>❌ Payment Failed</h3>
                <p>{paymentDetails?.message || 'Payment could not be processed'}</p>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal Component */}
        {showPaymentModal ? (
          <div className="payment-modal-wrapper">
            <RazorpayPaymentModal
              studentName={feeData.studentName}
              studentId={feeData.studentId}
              amount={feeData.amount}
              invoiceId={feeData.invoiceId}
              totalAmount={feeData.totalAmount}
              onSuccess={handlePaymentSuccess}
              onFailure={handlePaymentFailure}
            />
          </div>
        ) : (
          <div className="payment-button-section">
            <button
              className="pay-button"
              onClick={() => setShowPaymentModal(true)}
              disabled={paymentStatus === 'success'}
            >
              Pay ₹{parseFloat(feeData.amount).toFixed(2)} Now
            </button>
            <p className="payment-info">
              Click above to proceed to secure payment via Razorpay
            </p>
          </div>
        )}

        {/* Security Information */}
        <div className="security-info">
          <h3>🔒 Security Information</h3>
          <ul>
            <li>Your payment is processed securely by Razorpay</li>
            <li>We never see your bank or card details</li>
            <li>All transactions are encrypted and PCI DSS compliant</li>
            <li>Payment verification happens on our secure backend</li>
            <li>No sensitive information is stored on the frontend</li>
          </ul>
        </div>

        {/* FAQ Section */}
        <div className="faq-section">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-item">
            <h4>What payment methods are accepted?</h4>
            <p>We currently accept UPI payments (Google Pay, PhonePe, PayTM, BHIM, etc.)</p>
          </div>
          <div className="faq-item">
            <h4>Is my data secure?</h4>
            <p>
              Yes! Your sensitive data (Secret Keys, Bank Details) is never exposed to the
              frontend. All verification happens on our secure backend servers.
            </p>
          </div>
          <div className="faq-item">
            <h4>What if payment fails?</h4>
            <p>
              If payment fails, you'll see an error message. You can retry the payment or
              contact support.
            </p>
          </div>
          <div className="faq-item">
            <h4>When will my fee status update?</h4>
            <p>
              Your fee payment is recorded immediately after successful verification. You'll
              see a confirmation message.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PaymentPage;
