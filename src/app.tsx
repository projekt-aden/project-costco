import { Routes, Route, Navigate } from 'react-router-dom'
import { Shell } from './components/layout/shell'
import { DashboardPage } from './pages/dashboard'
import { ReceiptsPage } from './pages/receipts'
import { ReceiptDetailPage } from './pages/receipt-detail'
import { AnalysisPage } from './pages/analysis'
import { ProductDetailPage } from './pages/product-detail'
import { GasPage } from './pages/gas'
import { TrendsPage } from './pages/trends'
import { TopPage } from './pages/top'
import { ScanPage } from './pages/scan'
import { ProfilePage } from './pages/profile'

export function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/receipts" element={<ReceiptsPage />} />
        <Route path="/receipts/:id" element={<ReceiptDetailPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/analysis/:itemNumber" element={<ProductDetailPage />} />
        <Route path="/gas" element={<GasPage />} />
        <Route path="/trends" element={<TrendsPage />} />
        <Route path="/top" element={<TopPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  )
}
