import { Suspense, lazy, useEffect, useRef } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Shell } from './components/layout/shell'
import { DashboardPage } from './pages/dashboard'
import { AnalysisPage } from './pages/analysis'
import { GasPage } from './pages/gas'
import { TrendsPage } from './pages/trends'
import { TopPage } from './pages/top'

const ReceiptsPage = lazy(async () => {
  const module = await import('./pages/receipts')
  return { default: module.ReceiptsPage }
})

const ReceiptDetailPage = lazy(async () => {
  const module = await import('./pages/receipt-detail')
  return { default: module.ReceiptDetailPage }
})

const ProductDetailPage = lazy(async () => {
  const module = await import('./pages/product-detail')
  return { default: module.ProductDetailPage }
})

const ScanPage = lazy(async () => {
  const module = await import('./pages/scan')
  return { default: module.ScanPage }
})

const ProfilePage = lazy(async () => {
  const module = await import('./pages/profile')
  return { default: module.ProfilePage }
})

const GOATCOUNTER_ENDPOINT = 'https://projectaden.goatcounter.com/count'
const GOATCOUNTER_SCRIPT_ID = 'goatcounter-script'

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
    if (!import.meta.env.PROD) {
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
      <Suspense fallback={<RouteFallback />}>
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
      </Suspense>
    </Shell>
  )
}

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-text-3">
        <div className="w-8 h-8 border-2 border-border border-t-costco-red rounded-full animate-spin" />
        <p className="text-sm">Loading page...</p>
      </div>
    </div>
  )
}
