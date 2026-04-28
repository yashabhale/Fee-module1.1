import React, { useState } from 'react'
import { getDashboardMetrics, getMonthlyData, getPendingFeesData, getRecentTransactionsData } from '../data/dashboardData'
import { invoiceDatabase } from '../data/invoiceData'

const ExportReport = () => {
  const [selectedReport, setSelectedReport] = useState('fee-collection')
  const [exportFormat, setExportFormat] = useState('csv')
  const [dateRange, setDateRange] = useState('all-time')

  // Generate CSV content
  const generateCSV = (data, headers) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header]
        // Escape commas and quotes in values
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      }).join(','))
    ].join('\n')
    return csvContent
  }

  // Generate PDF (using a simple approach with text format)
  const generatePDF = (reportTitle, content) => {
    const timestamp = new Date().toLocaleString()
    let pdfContent = `${reportTitle}\n`
    pdfContent += `Generated on: ${timestamp}\n`
    pdfContent += `${'='.repeat(50)}\n\n`
    pdfContent += content
    return pdfContent
  }

  // Fee Collection Report
  const generateFeeCollectionReport = () => {
    const data = [
      {
        Category: 'Total Collected',
        Amount: dashboardMetrics.totalCollected,
        Percentage: '100%'
      },
      {
        Category: 'Total Pending',
        Amount: dashboardMetrics.totalPending,
        Percentage: Math.round((dashboardMetrics.totalPending / (dashboardMetrics.totalCollected + dashboardMetrics.totalPending)) * 100) + '%'
      },
      {
        Category: 'Total Overdue',
        Amount: dashboardMetrics.totalOverdue,
        Percentage: Math.round((dashboardMetrics.totalOverdue / dashboardMetrics.totalCollected) * 100) + '%'
      },
      {
        Category: 'Total Refund',
        Amount: dashboardMetrics.totalRefund,
        Percentage: Math.round((dashboardMetrics.totalRefund / dashboardMetrics.totalCollected) * 100) + '%'
      }
    ]

    const headers = ['Category', 'Amount', 'Percentage']

    if (exportFormat === 'csv') {
      return generateCSV(data, headers)
    } else {
      return generatePDF('FEE COLLECTION REPORT', 
        data.map(d => `${d.Category}: ₹${d.Amount} (${d.Percentage})`).join('\n')
      )
    }
  }

  // Monthly Fee Report
  const generateMonthlyFeeReport = () => {
    const data = monthlyData.map(month => ({
      Month: month.month,
      Collected: month.collected,
      Pending: month.pending,
      Total: month.collected + month.pending
    }))

    const headers = ['Month', 'Collected', 'Pending', 'Total']

    if (exportFormat === 'csv') {
      return generateCSV(data, headers)
    } else {
      return generatePDF('MONTHLY FEE REPORT', 
        data.map(d => `${d.Month}: Collected ₹${d.Collected}, Pending ₹${d.Pending}, Total ₹${d.Total}`).join('\n')
      )
    }
  }

  // Pending Fees Report
  const generatePendingFeesReport = () => {
    const data = pendingFeesData.map(fee => ({
      StudentName: fee.studentName,
      Class: fee.class,
      Amount: fee.amount,
      DueDate: fee.dueDate,
      DaysOverdue: Math.max(0, Math.floor((new Date() - new Date(fee.dueDate)) / (1000 * 60 * 60 * 24)))
    }))

    const headers = ['StudentName', 'Class', 'Amount', 'DueDate', 'DaysOverdue']

    if (exportFormat === 'csv') {
      return generateCSV(data, headers)
    } else {
      return generatePDF('PENDING FEES REPORT', 
        data.map(d => `${d.StudentName} (${d.Class}): ₹${d.Amount} - Due: ${d.DueDate} (${d.DaysOverdue} days overdue)`).join('\n')
      )
    }
  }

  // All Invoices Report
  const generateAllInvoicesReport = () => {
    const data = Object.values(invoiceDatabase).map(invoice => ({
      InvoiceId: invoice.invoiceId,
      StudentName: invoice.studentName,
      Class: invoice.class,
      TotalAmount: invoice.totalAmount,
      PaidAmount: invoice.paidAmount,
      Status: invoice.status,
      Date: invoice.invoiceDate
    }))

    const headers = ['InvoiceId', 'StudentName', 'Class', 'TotalAmount', 'PaidAmount', 'Status', 'Date']

    if (exportFormat === 'csv') {
      return generateCSV(data, headers)
    } else {
      return generatePDF('ALL INVOICES REPORT', 
        data.map(d => `${d.InvoiceId} - ${d.StudentName} (${d.Class}): ₹${d.TotalAmount} | Paid: ₹${d.PaidAmount} | ${d.Status}`).join('\n')
      )
    }
  }

  // Transactions Report
  const generateTransactionsReport = () => {
    const data = recentTransactionsData.map(txn => ({
      StudentName: txn.studentName,
      Amount: txn.amount,
      Date: txn.date,
      Status: txn.status.charAt(0).toUpperCase() + txn.status.slice(1)
    }))

    const headers = ['StudentName', 'Amount', 'Date', 'Status']

    if (exportFormat === 'csv') {
      return generateCSV(data, headers)
    } else {
      return generatePDF('TRANSACTIONS REPORT', 
        data.map(d => `${d.StudentName}: ₹${d.Amount} on ${d.Date} - ${d.Status}`).join('\n')
      )
    }
  }

  // Get the appropriate report content
  const getReportContent = () => {
    switch (selectedReport) {
      case 'fee-collection':
        return generateFeeCollectionReport()
      case 'monthly-fee':
        return generateMonthlyFeeReport()
      case 'pending-fees':
        return generatePendingFeesReport()
      case 'all-invoices':
        return generateAllInvoicesReport()
      case 'transactions':
        return generateTransactionsReport()
      default:
        return ''
    }
  }

  // Download function
  const handleExport = () => {
    const content = getReportContent()
    const reportNames = {
      'fee-collection': 'Fee Collection Report',
      'monthly-fee': 'Monthly Fee Report',
      'pending-fees': 'Pending Fees Report',
      'all-invoices': 'All Invoices Report',
      'transactions': 'Transactions Report'
    }

    const fileName = `${reportNames[selectedReport]}_${new Date().toISOString().split('T')[0]}.${exportFormat === 'csv' ? 'csv' : 'txt'}`
    
    const element = document.createElement('a')
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(content)}`)
    element.setAttribute('download', fileName)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Export Report</h1>
      </div>
      
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Export Options</h2>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Select Report Type</label>
              <select 
                value={selectedReport} 
                onChange={(e) => setSelectedReport(e.target.value)}
                className="form-select"
              >
                <option value="fee-collection">Fee Collection Summary</option>
                <option value="monthly-fee">Monthly Fee Report</option>
                <option value="pending-fees">Pending Fees Report</option>
                <option value="all-invoices">All Invoices Report</option>
                <option value="transactions">Transactions Report</option>
              </select>
            </div>

            <div className="form-group">
              <label>Export Format</label>
              <select 
                value={exportFormat} 
                onChange={(e) => setExportFormat(e.target.value)}
                className="form-select"
              >
                <option value="csv">CSV (.csv)</option>
                <option value="txt">Text (.txt)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date Range</label>
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="form-select"
              >
                <option value="all-time">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="last-quarter">Last Quarter</option>
                <option value="this-year">This Year</option>
              </select>
            </div>

            <button onClick={handleExport} className="btn btn-primary">
              📥 Download Report
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Report Preview</h2>
          </div>
          <div className="card-body">
            <div className="preview-content">
              {getReportContent().split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">📋 Available Reports</h2>
        </div>
        <div className="card-body">
          <ul>
            <li><strong>Fee Collection Summary:</strong> Overview of collected, pending, overdue, and refunded fees</li>
            <li><strong>Monthly Fee Report:</strong> Monthly breakdown of collected vs pending fees</li>
            <li><strong>Pending Fees Report:</strong> List of all students with pending fee payments</li>
            <li><strong>All Invoices Report:</strong> Complete list of all invoices and their payment status</li>
            <li><strong>Transactions Report:</strong> Recent transaction history with status</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ExportReport
