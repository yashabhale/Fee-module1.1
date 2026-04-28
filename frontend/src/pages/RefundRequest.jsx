import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function RefundRequest() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    invoiceId: '',
    studentName: '',
    amount: '',
    reason: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.invoiceId || !formData.studentName || !formData.amount || !formData.reason) {
      alert('Please fill in all required fields');
      return;
    }

    // Store data in sessionStorage
    const refundData = {
      requestId: 'RFD-' + Date.now(),
      invoiceId: formData.invoiceId,
      studentName: formData.studentName,
      amount: formData.amount,
      formattedAmount: `₹${parseInt(formData.amount).toLocaleString()}`,
      reason: formData.reason,
      notes: formData.notes,
      status: 'Pending Review',
      requestedDate: new Date().toISOString().split('T')[0]
    };
    
    sessionStorage.setItem('newRefundData', JSON.stringify(refundData));
    
    // Navigate to success page with state
    navigate('/refund/success', { 
      state: { 
        successData: {
          requestId: refundData.requestId,
          invoiceId: refundData.invoiceId,
          amount: refundData.formattedAmount,
          status: refundData.status
        }
      },
      replace: true // Use replace to prevent back button issues
    });
  };

  const handleCancel = () => {
    navigate('/refund-management');
  };

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/refund-management')}>
        <ArrowLeft size={20} />
        <span>Back to Refund Management</span>
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Refund Request</h1>
          <p className="page-sub">Submit a refund request for payment reversal</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                Invoice ID <span className="req">*</span>
              </label>
              <input
                type="text"
                name="invoiceId"
                value={formData.invoiceId}
                onChange={handleChange}
                placeholder="INV-2024-001"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Student Name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
                placeholder="Enter student name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Payment Amount <span className="req">*</span>
              </label>
              <div className="amount-input-wrapper">
                <span className="currency-prefix">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className="form-input amount-input"
                  placeholder="Enter amount"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                Reason for Refund <span className="req">*</span>
              </label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select a reason</option>
                <option value="Duplicate Payment">Duplicate Payment</option>
                <option value="Student Withdrawal">Student Withdrawal</option>
                <option value="Overpayment">Overpayment</option>
                <option value="Technical Error">Technical Error</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                rows="4"
                placeholder="Any additional information about this refund request..."
              />
            </div>

            <div className="flex gap-3 justify-end mt-4">
              <button type="button" className="btn btn-outline" onClick={handleCancel}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Refund Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RefundRequest;