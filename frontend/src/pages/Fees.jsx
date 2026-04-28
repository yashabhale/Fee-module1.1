import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, ArrowLeft } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { MdSms } from 'react-icons/md'
import { transactionsData } from '../data/transactionsData'

const Fees = () => {
  const navigate = useNavigate()
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')

  const statusOptions = ['All', 'Paid', 'Pending', 'Failed', 'Partially Paid']

  useEffect(() => {
    filterTransactions()
  }, [searchTerm, filterStatus])

  const filterTransactions = () => {
    let filtered = [...transactionsData]

    // Filter by status
    if (filterStatus !== 'All') {
      filtered = filtered.filter((tx) => {
        if (filterStatus === 'Partially Paid') {
          return tx.status === 'Pending' && (tx.amountPaid || 0) > 0 && (tx.amountPaid || 0) < tx.amount
        }
        return tx.status === filterStatus
      })
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.class.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredTransactions(filtered)
  }

  const handleView = (invoiceId) => {
    navigate(`/invoice/${invoiceId}`)
  }

  const getPaymentStatus = (transaction) => {
    const amountPaid = transaction.amountPaid || 0
    if (transaction.status === 'Paid') return { text: 'Paid', class: 'badge-green' }
    if (amountPaid > 0 && amountPaid < transaction.amount) return { text: 'Partially Paid', class: 'badge-orange' }
    if (transaction.status === 'Pending') return { text: 'Pending', class: 'badge-yellow' }
    return { text: transaction.status, class: 'badge-red' }
  }

  const getRemainingAmount = (transaction) => {
    const amountPaid = transaction.amountPaid || 0
    return transaction.amount - amountPaid
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <button className="back-btn mb-2" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="page-title">Payment Monitoring</h1>
          <p className="page-sub">Track and monitor all payment transactions</p>
        </div>
      </div>

      {/* Search & Filter Section */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex-1" style={{ minWidth: '200px' }}>
          <div className="input-wrap">
            <Search size={18} className="input-icon" />
            <input
              type="text"
              placeholder="Search by name or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="form-select"
          style={{ width: '150px' }}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status === 'All' ? 'All Status' : status}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 className="card-title">No Transactions Found</h3>
            <p className="text-muted">
              {searchTerm || filterStatus !== 'All' ? 'Try adjusting your search filters' : 'No transactions available yet'}
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Pending Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                    <th>Send Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => {
                    const statusInfo = getPaymentStatus(tx)
                    const pendingAmount = getRemainingAmount(tx)
                    const amountPaid = tx.amountPaid || 0
                    
                    return (
                      <tr key={tx.id}>
                        <td className="td-mono" style={{ color: 'var(--primary)', fontWeight: '600' }}>{tx.invoiceId}</td>
                        <td className="td-bold">{tx.studentName}</td>
                        <td>{tx.class}</td>
                        <td className="td-bold">₹{tx.amount.toLocaleString()}</td>
                        <td className={amountPaid > 0 ? 'text-green-600' : 'text-muted'}>
                          {amountPaid > 0 ? `₹${amountPaid.toLocaleString()}` : '-'}
                        </td>
                        <td className={pendingAmount > 0 ? 'text-orange-600' : 'text-muted'}>
                          {pendingAmount > 0 ? `₹${pendingAmount.toLocaleString()}` : '-'}
                        </td>
                        <td className="text-muted">{tx.paymentMethod || '-'}</td>
                        <td>
                          <span className={`badge ${statusInfo.class}`}>
                            {statusInfo.text}
                          </span>
                        </td>
                        <td className="text-muted">{tx.date}</td>
                        <td>
                          <button
                            onClick={() => handleView(tx.invoiceId)}
                            className="btn btn-primary btn-sm"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        </td>
                        <td>
                          <div className="flex gap-2 items-center">
                            {tx.phone && (
                              <>
                                <a
                                  href={`https://wa.me/91${tx.phone}?text=${encodeURIComponent(
                                    pendingAmount > 0 
                                      ? `Hello, your pending fee of ₹${pendingAmount} is due. Total fee: ₹${tx.amount}, Paid: ₹${amountPaid}. Please pay at your earliest.`
                                      : `Hello, your fee of ₹${tx.amount} has been paid successfully. Thank you!`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '6px', color: 'var(--green)' }}
                                  title="Send WhatsApp"
                                >
                                  <FaWhatsapp size={16} />
                                </a>
                                <a
                                  href={`sms:${tx.phone}?body=${encodeURIComponent(
                                    pendingAmount > 0 
                                      ? `Hello, your pending fee of ₹${pendingAmount} is due. Total fee: ₹${tx.amount}, Paid: ₹${amountPaid}. Please pay at your earliest.`
                                      : `Hello, your fee of ₹${tx.amount} has been paid successfully. Thank you!`
                                  )}`}
                                  className="btn btn-ghost btn-sm"
                                  style={{ padding: '6px', color: 'var(--blue)' }}
                                  title="Send SMS"
                                >
                                  <MdSms size={16} />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="flex gap-6 mt-4 pt-4 border-t flex-wrap">
              <div>
                <span className="text-muted">Total Transactions: </span>
                <span className="font-semibold">{filteredTransactions.length}</span>
              </div>
              <div>
                <span className="text-muted">Total Amount: </span>
                <span className="font-semibold">₹{filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted">Total Collected: </span>
                <span className="font-semibold text-green-600">
                  ₹{filteredTransactions.reduce((sum, tx) => sum + (tx.amountPaid || 0), 0).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted">Total Pending: </span>
                <span className="font-semibold text-orange-600">
                  ₹{filteredTransactions.reduce((sum, tx) => sum + (tx.amount - (tx.amountPaid || 0)), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fees