import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import BulkUpload from './pages/BulkUpload'
import ExportReport from './pages/ExportReport'
import Fees from './pages/Fees'
import Invoice from './pages/Invoice'
import Payment from './pages/Payment'
import PaymentSuccess from './pages/PaymentSuccess'
import Receipt from './pages/Receipt'
import RefundManagement from './pages/RefundManagement'
import RefundRequest from './pages/RefundRequest'
import RefundDetails from './pages/RefundDetails'
import RefundRequestSuccess from './pages/RefundRequestSuccess'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/bulk-upload" element={<MainLayout><BulkUpload /></MainLayout>} />
        <Route path="/export-report" element={<MainLayout><ExportReport /></MainLayout>} />
        <Route path="/fees" element={<MainLayout><Fees /></MainLayout>} />
        <Route path="/invoice/:invoiceId" element={<MainLayout><Invoice /></MainLayout>} />
        <Route path="/payment/:invoiceId" element={<MainLayout><Payment /></MainLayout>} />
        <Route path="/payment-success" element={<MainLayout><PaymentSuccess /></MainLayout>} />
        <Route path="/receipt/:invoiceId" element={<MainLayout><Receipt /></MainLayout>} />
        <Route path="/refund/success" element={<MainLayout><RefundRequestSuccess /></MainLayout>} />
        <Route path="/refund-management" element={<MainLayout><RefundManagement /></MainLayout>} />
        <Route path="/refund-request" element={<MainLayout><RefundRequest /></MainLayout>} />
        <Route path="/refund-details/:id" element={<MainLayout><RefundDetails /></MainLayout>} />
      </Routes>
    </Router>
  )
}

export default App