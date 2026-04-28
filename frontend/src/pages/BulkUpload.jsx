import React, { useState } from 'react' // Removed unused useCallback
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, DollarSign, FileText, CreditCard, Users, CheckCircle, Clock, Upload, Download, X, File, AlertCircle } from 'lucide-react'

const BulkUpload = () => {
  const navigate = useNavigate()
  const [selectedCard, setSelectedCard] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [previewData, setPreviewData] = useState(null)

  const [uploads] = useState([
    { id: 1, type: 'Fee Structure', fileName: 'q1_fees_2024.csv', records: 120, status: 'Success', uploadedBy: 'Admin User', time: '2024-03-13 10:30 AM' },
    { id: 2, type: 'Bulk Invoices', fileName: 'march_invoices.csv', records: 450, status: 'Success', uploadedBy: 'Admin User', time: '2024-03-12 02:15 PM' },
    { id: 3, type: 'Payment Records', fileName: 'payments_feb_2024.csv', records: 328, status: 'Success', uploadedBy: 'Finance Manager', time: '2024-03-10 11:45 AM' },
    { id: 4, type: 'Student Data', fileName: 'new_admissions.csv', records: 45, status: 'Processing', uploadedBy: 'Admin User', time: '2024-03-09 09:20 AM' },
  ])

  const uploadCards = [
    {
      id: 1,
      title: 'Fee Structure',
      description: 'Upload fee categories and amounts for different classes',
      icon: DollarSign,
      iconBg: '#e6f8ed',
      iconColor: '#22c55e',
      features: ['Define fee categories', 'Set class-wise fees', 'Academic year mapping'],
      templateColumns: ['Class', 'Category', 'Amount', 'Due Date']
    },
    {
      id: 2,
      title: 'Bulk Invoices',
      description: 'Generate invoices for multiple students at once',
      icon: FileText,
      iconBg: '#dbf4ff',
      iconColor: '#0ea5e9',
      features: ['Auto-generate invoices', 'Custom due dates', 'Batch processing'],
      templateColumns: ['Student ID', 'Student Name', 'Class', 'Amount', 'Due Date']
    },
    {
      id: 3,
      title: 'Payment Records',
      description: 'Upload payment transactions in bulk',
      icon: CreditCard,
      iconBg: '#f3e8ff',
      iconColor: '#8b5cf6',
      features: ['Import payment history', 'Reconciliation support', 'Multi-method support'],
      templateColumns: ['Invoice ID', 'Student Name', 'Amount', 'Payment Date', 'Payment Method']
    },
    {
      id: 4,
      title: 'Student Data',
      description: 'Import student information and contact details',
      icon: Users,
      iconBg: '#fef3c7',
      iconColor: '#f59e0b',
      features: ['Student profiles', 'Parent information', 'Class assignments'],
      templateColumns: ['Student Name', 'Class', 'Roll Number', 'Parent Name', 'Phone', 'Email']
    },
  ]

  const handleBackToDashboard = () => {
    navigate('/')
  }

  const getCardTypeKey = (cardTitle) => {
    const typeMap = {
      'Fee Structure': 'feeStructure',
      'Bulk Invoices': 'invoices',
      'Payment Records': 'payments',
      'Student Data': 'students',
    }
    return typeMap[cardTitle] || 'feeStructure'
  }

  const openModal = (cardTitle) => {
    setSelectedCard(getCardTypeKey(cardTitle))
    setSelectedFile(null)
    setPreviewData(null)
    setUploadProgress(0)
    setIsUploading(false)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedCard(null)
    setSelectedFile(null)
    setPreviewData(null)
    setUploadProgress(0)
    setIsUploading(false)
    setDragActive(false)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        setSelectedFile(file)
        parseCSVPreview(file)
      } else {
        alert("Please upload a CSV file")
      }
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === "text/csv" || file.name.endsWith('.csv')) {
        setSelectedFile(file)
        parseCSVPreview(file)
      } else {
        alert("Please upload a CSV file")
      }
    }
  }

  const parseCSVPreview = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n')
      const headers = lines[0]?.split(',').map(h => h.trim()) || []
      const previewRows = lines.slice(1, 6).map(line => line.split(',').map(cell => cell.trim()))
      
      setPreviewData({
        headers,
        rows: previewRows.filter(row => row.length > 1 && row[0])
      })
    }
    reader.readAsText(file)
  }

  const downloadTemplate = () => {
    if (!selectedCard) return // Added guard clause
    
    const selectedCardData = uploadCards.find(card => getCardTypeKey(card.title) === selectedCard)
    if (!selectedCardData) return
    
    const headers = selectedCardData.templateColumns.join(',')
    const sampleRow = selectedCardData.templateColumns.map(() => 'Sample Data').join(',')
    const csvContent = `${headers}\n${sampleRow}`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedCard}_template.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    setIsUploading(true)
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setUploadProgress(i)
    }
    
    // Simulate API call
    setTimeout(() => {
      setIsUploading(false)
      alert("File uploaded successfully!")
      closeModal()
    }, 500)
  }

  const getCurrentCard = () => {
    if (!selectedCard) return null // Added guard clause
    
    const typeMap = {
      feeStructure: 'Fee Structure',
      invoices: 'Bulk Invoices',
      payments: 'Payment Records',
      students: 'Student Data'
    }
    const title = typeMap[selectedCard] || 'Fee Structure'
    return uploadCards.find(card => card.title === title)
  }

  const currentCard = getCurrentCard()

  return (
    <>
      <div className="page">
        {/* Back to Dashboard */}
        <button className="back-btn" onClick={handleBackToDashboard}>
          <ArrowLeft size={20} />
          <span>Back to Dashboard</span>
        </button>

        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Bulk Upload & Data Import</h1>
            <p className="page-sub">Upload CSV files to import data in bulk and save time</p>
          </div>
        </div>

        {/* Upload Cards Section */}
        <div className="grid-2">
          {uploadCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div key={card.id} className="card upload-card">
                <div className="card-body">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="stat-icon" style={{ backgroundColor: card.iconBg, color: card.iconColor }}>
                      <IconComponent size={24} />
                    </div>
                    <h3 className="card-title">{card.title}</h3>
                  </div>
                  <p className="text-muted mb-4">{card.description}</p>
                  <ul className="space-y-1 mb-4">
                    {card.features.map((feature, idx) => (
                      <li key={idx} className="text-sm">• {feature}</li>
                    ))}
                  </ul>
                  <button className="btn btn-primary w-full" onClick={() => openModal(card.title)}>
                    <Upload size={16} />
                    Upload CSV
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Recent Uploads Section */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Recent Uploads</h2>
              <p className="card-sub">Track your bulk upload history</p>
            </div>
          </div>

          <div className="card-body">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Upload Type</th>
                    <th>File Name</th>
                    <th>Records Processed</th>
                    <th>Status</th>
                    <th>Uploaded By</th>
                    <th>Upload Time</th>
                  </tr>
                </thead>
                <tbody>
                  {uploads.map((upload) => (
                    <tr key={upload.id}>
                      <td className="td-bold">{upload.type}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-muted" />
                          <span>{upload.fileName}</span>
                        </div>
                      </td>
                      <td className="td-mono">{upload.records}</td>
                      <td>
                        <span className={`badge ${upload.status === 'Success' ? 'badge-green' : 'badge-yellow'}`}>
                          {upload.status === 'Success' ? (
                            <>
                              <CheckCircle size={12} />
                              {upload.status}
                            </>
                          ) : (
                            <>
                              <Clock size={12} />
                              {upload.status}
                            </>
                          )}
                        </span>
                      </td>
                      <td>{upload.uploadedBy}</td>
                      <td className="text-muted">{upload.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {isModalOpen && currentCard && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="modal-title">Bulk Upload {currentCard.title}</h2>
                <p className="modal-subtitle">
                  Upload a CSV file to import {currentCard.title.toLowerCase()} data in bulk
                </p>
              </div>
              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Instructions Section */}
              <div className="upload-instructions">
                <div className="instructions-content">
                  <h4>Instructions:</h4>
                  <ul>
                    <li>Download the CSV template to see the required format</li>
                    <li>Fill in your data following the template structure</li>
                    <li>Upload the completed CSV file</li>
                    <li>Review the preview and confirm the upload</li>
                  </ul>
                </div>
              </div>

              {/* Template Download */}
              <div className="template-download">
                <div className="template-info">
                  <File size={20} />
                  <div>
                    <div className="template-title">CSV Template</div>
                    <div className="template-desc">Download the template file to get started</div>
                  </div>
                </div>
                <button className="btn btn-outline" onClick={downloadTemplate}>
                  <Download size={16} />
                  Download Template
                </button>
              </div>

              {/* File Upload Area */}
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {!selectedFile ? (
                  <>
                    <div className="upload-icon">
                      <Upload size={48} />
                    </div>
                    <div className="upload-text">
                      <span className="upload-click">Click to upload</span> or drag and drop
                    </div>
                    <div className="upload-format">CSV files only</div>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="upload-input"
                    />
                  </>
                ) : (
                  <div className="selected-file">
                    <File size={32} />
                    <div className="file-info">
                      <div className="file-name">{selectedFile.name}</div>
                      <div className="file-size">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                    <button 
                      className="remove-file"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Preview Section */}
              {previewData && previewData.headers && previewData.headers.length > 0 && (
                <div className="preview-section">
                  <div className="preview-header">
                    <h4>Preview Data</h4>
                    <span className="preview-count">
                      Showing first {previewData.rows.length} rows
                    </span>
                  </div>
                  <div className="preview-table-wrap">
                    <table className="preview-table">
                      <thead>
                        <tr>
                          {previewData.headers.map((header, idx) => (
                            <th key={idx}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.rows.map((row, idx) => (
                          <tr key={idx}>
                            {row.map((cell, cellIdx) => (
                              <td key={`${idx}-${cellIdx}`}>{cell || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="preview-note">
                    <AlertCircle size={14} />
                    <span>Please verify the data format before uploading</span>
                  </div>
                </div>
              )}

              {/* Upload Progress */}
              {isUploading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="progress-text">{uploadProgress}% Uploaded</div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="modal-actions">
                <button className="btn btn-outline" onClick={closeModal}>
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Upload & Process'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BulkUpload