import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

const GOATCOUNTER_ENDPOINT = import.meta.env.VITE_GOATCOUNTER_ENDPOINT
const GOATCOUNTER_SCRIPT_ID = 'goatcounter-script'
const GOATCOUNTER_ENABLED = import.meta.env.PROD && import.meta.env.VITE_ENABLE_GOATCOUNTER === 'true'

type GoatCounterApi = {
  count?: (vars?: { path?: string; title?: string }) => void
  no_onload?: boolean
}

function getGoatCounterPath() {
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
  return path || '/'
}

function GoatCounterAnalytics() {
  const location = useLocation()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (!GOATCOUNTER_ENABLED || !GOATCOUNTER_ENDPOINT) {
      return
    }

    const trackedWindow = window as Window & { goatcounter?: GoatCounterApi }
    trackedWindow.goatcounter = {
      ...trackedWindow.goatcounter,
      no_onload: true,
    }

    const trackPageView = () => {
      const path = getGoatCounterPath()
      if (lastTrackedPath.current === path) {
        return
      }

      trackedWindow.goatcounter?.count?.({
        path,
        title: document.title,
      })
      lastTrackedPath.current = path
    }

    const existingScript = document.getElementById(GOATCOUNTER_SCRIPT_ID) as HTMLScriptElement | null
    if (existingScript) {
      trackPageView()
      return
    }

    const script = document.createElement('script')
    script.id = GOATCOUNTER_SCRIPT_ID
    script.async = true
    script.src = 'https://gc.zgo.at/count.js'
    script.dataset.goatcounter = GOATCOUNTER_ENDPOINT
    script.addEventListener('load', trackPageView, { once: true })
    document.body.appendChild(script)
  }, [location])

  return null
}

export function App() {
  return (
    <Shell>
      <GoatCounterAnalytics />
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
