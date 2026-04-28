import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, ArrowLeft, Bell } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa'
import { MdSms } from 'react-icons/md'
import { transactionsData } from '../data/transactionsData'

const Fees = () => {
  const navigate = useNavigate()
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [toast, setToast] = useState(null)

  const statusOptions = ['All', 'Paid', 'Pending', 'Failed', 'Partially Paid']

  useEffect(() => {
    filterTransactions()
  }, [searchTerm, filterStatus])

  const showToast = (message, type = 'info') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleNotifyPaid = () => {
    const paidRecords = filteredTransactions.filter(tx => tx.status === 'Paid')
    if (paidRecords.length > 0) {
      showToast(`Fees paid successfully for ${paidRecords.length} student(s)`, 'success')
    } else {
      showToast('No paid records found', 'info')
    }
  }

  const handleNotifyPending = () => {
    const pendingRecords = filteredTransactions.filter(tx => tx.status === 'Pending' || (tx.amountPaid || 0) < tx.amount)
    if (pendingRecords.length > 0) {
      showToast(`Your fee is pending for ${pendingRecords.length} student(s)`, 'warning')
    } else {
      showToast('No pending records found', 'info')
    }
  }

  const filterTransactions = () => {
    let filtered = [...transactionsData]

    if (filterStatus !== 'All') {
      filtered = filtered.filter((tx) => {
        if (filterStatus === 'Partially Paid') {
          return tx.status === 'Pending' && (tx.amountPaid || 0) > 0 && (tx.amountPaid || 0) < tx.amount
        }
        return tx.status === filterStatus
      })
    }

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

  // ✅ FIXED FUNCTION
  const handleView = (transaction) => {
    if (transaction.status === 'Paid') {

      const paymentData = {
        invoiceId: transaction.invoiceId,
        studentName: transaction.studentName,
        amount: transaction.amountPaid || transaction.amount,
        paymentMethod: transaction.paymentMethod || 'Cash',
        transactionId: 'TXN' + Date.now(),
        timestamp: new Date().toISOString()
      }

      sessionStorage.setItem('paymentData', JSON.stringify(paymentData))

      navigate('/payment-success')

    } else {
      navigate(`/invoice/${transaction.invoiceId}`)
    }
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

        <div className="flex gap-2">
          <button onClick={handleNotifyPaid} className="btn btn-success btn-sm">
            <Bell size={14} />
            Notify Paid
          </button>
          <button onClick={handleNotifyPending} className="btn btn-warning btn-sm">
            <Bell size={14} />
            Notify Pending
          </button>
        </div>
      </div>

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
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const statusInfo = getPaymentStatus(tx)
                  const pendingAmount = getRemainingAmount(tx)

                  return (
                    <tr key={tx.id}>
                      <td>{tx.invoiceId}</td>
                      <td>{tx.studentName}</td>
                      <td>{tx.class}</td>
                      <td>₹{tx.amount}</td>
                      <td>₹{tx.amountPaid || 0}</td>
                      <td>₹{pendingAmount}</td>
                      <td>
                        <span className={`badge ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => handleView(tx)} className="btn btn-primary btn-sm">
                          <Eye size={14} /> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Fees
