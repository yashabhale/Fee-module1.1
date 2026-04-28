import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ArrowLeft, User, FileText, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

function RefundDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Mock data - in real app, fetch from API based on id
  const [refund, setRefund] = useState({
    id: id || 'REF-2024-001',
    studentName: 'Aarav Sharma',
    invoiceId: 'INV-2024-015',
    amount: 25000,
    reason: 'Duplicate Payment',
    status: 'Pending',
    requestedDate: '2024-03-08',
    adminNotes: ''
  })

  const handleApprove = () => {
    setRefund(prev => ({ ...prev, status: 'Approved' }))
  }

  const handleReject = () => {
    setRefund(prev => ({ ...prev, status: 'Rejected' }))
  }

  const handleProcess = () => {
    setRefund(prev => ({ ...prev, status: 'Processed' }))
  }

  const handleNotesChange = (e) => {
    setRefund(prev => ({ ...prev, adminNotes: e.target.value }))
  }

  const handleClose = () => {
    navigate('/refund-management')
  }

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'Pending':
        return 'badge-status-pending'
      case 'Approved':
        return 'badge-status-approved'
      case 'Rejected':
        return 'badge-status-rejected'
      case 'Processed':
        return 'badge-status-processed'
      default:
        return 'badge-gray'
    }
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending':
        return <Clock size={16} />
      case 'Approved':
        return <CheckCircle size={16} />
      case 'Rejected':
        return <XCircle size={16} />
      case 'Processed':
        return <CheckCircle size={16} />
      default:
        return null
    }
  }

  return (
    <div className="page">
      {/* Back Button */}
      <button className="back-btn" onClick={handleClose}>
        <ArrowLeft size={20} />
        <span>Back to Refund Management</span>
      </button>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Refund Request Details</h1>
          <p className="page-sub">Review and manage refund request #{refund.id}</p>
        </div>
        <div className="page-actions">
          <span className={`badge ${getStatusBadgeClass(refund.status)}`}>
            {getStatusIcon(refund.status)}
            {refund.status}
          </span>
        </div>
      </div>

      {/* Details Card */}
      <div className="card">
        {/* Student Information Section */}
        <div className="card-header">
          <div className="flex items-center gap-2">
            <User size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title">Student Information</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2">
            <div className="info-item">
              <div className="form-label">Student Name</div>
              <div className="info-value-box">{refund.studentName}</div>
            </div>
            <div className="info-item">
              <div className="form-label">Invoice ID</div>
              <div className="info-value-box td-mono">{refund.invoiceId}</div>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Refund Information Section */}
        <div className="card-header">
          <div className="flex items-center gap-2">
            <FileText size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title">Refund Information</h3>
          </div>
        </div>
        <div className="card-body">
          <div className="grid-2">
            <div className="info-item">
              <div className="form-label">Amount</div>
              <div className="info-value-box td-bold">₹{refund.amount.toLocaleString()}</div>
            </div>
            <div className="info-item">
              <div className="form-label">Requested Date</div>
              <div className="info-value-box">{refund.requestedDate}</div>
            </div>
            <div className="info-item">
              <div className="form-label">Reason</div>
              <div className="info-value-box">{refund.reason}</div>
            </div>
            <div className="info-item">
              <div className="form-label">Status</div>
              <div className="info-value-box">
                <span className={`badge ${getStatusBadgeClass(refund.status)}`}>
                  {getStatusIcon(refund.status)}
                  {refund.status}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Admin Notes Section */}
        <div className="card-header">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} style={{ color: 'var(--primary)' }} />
            <h3 className="card-title">Admin Notes</h3>
          </div>
        </div>
        <div className="card-body">
          <textarea
            className="form-textarea"
            placeholder="Add notes about this refund request..."
            value={refund.adminNotes}
            onChange={handleNotesChange}
            rows="4"
          />
        </div>

        {/* Action Buttons */}
        <div className="card-body">
          <div className="flex gap-3" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={handleClose}>
              Close
            </button>
            {refund.status === 'Pending' && (
              <>
                <button className="btn btn-danger" onClick={handleReject}>
                  Reject
                </button>
                <button className="btn btn-primary" onClick={handleApprove}>
                  Approve
                </button>
              </>
            )}
            {refund.status === 'Approved' && (
              <button className="btn btn-primary" onClick={handleProcess}>
                Mark as Processed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Box for Guidance */}
      {refund.status === 'Pending' && (
        <div className="info-box info-box-blue mt-4">
          <AlertCircle size={20} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          <div>
            <div className="info-box-title">Review Required</div>
            <div className="info-box-text">
              Please verify the refund request details before approving or rejecting.
              Approved refunds will be processed for payment.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RefundDetails