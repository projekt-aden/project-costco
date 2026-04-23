import { useState } from 'react'
import { SummaryCards } from '../components/dashboard/summary-cards'
import { InsightSummary } from '../components/dashboard/insight-summary'
import { QuickFind } from '../components/dashboard/quick-find'
import { HabitInsights } from '../components/dashboard/habit-insights'
import { TripInsights } from '../components/dashboard/trip-insights'
import { BasketInsights } from '../components/dashboard/basket-insights'
import { ImportButton, DropZone } from '../components/receipt/import-button'
import { DemoModeBanner, EmptyDemoOnboarding } from '../components/receipt/demo-mode-banner'
import { clearAllData, loadDemoReceipts, useDemoMode, useReceipts } from '../hooks/use-receipts'
import { useFilteredReceipts } from '../hooks/use-year-filter'
import { YearPicker } from '../components/ui/year-picker'
import { PageActionCard, PageIntro, PageSection } from '../components/layout/page-shell'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  Hash,
  Loader2,
  MapPin,
  Trophy,
  TrendingUp,
} from 'lucide-react'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const PAGE_SIZE = 5

export function DashboardPage() {
  const allReceipts = useReceipts()
  const receipts = useFilteredReceipts()
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  const [demoBusy, setDemoBusy] = useState(false)
  const [demoStatus, setDemoStatus] = useState<string | null>(null)
  const [demoError, setDemoError] = useState<string | null>(null)
  const demoMode = useDemoMode()

  const visible = showAll ? receipts : receipts.slice(0, PAGE_SIZE)
  const hasMore = receipts.length > PAGE_SIZE

  async function handleTryDemo() {
    setDemoBusy(true)
    setDemoError(null)
    setDemoStatus('Loading demo receipts...')
    try {
      await loadDemoReceipts()
      setDemoStatus(null)
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Could not load demo data')
      setDemoStatus(null)
    } finally {
      setDemoBusy(false)
    }
  }

  async function handleStartFresh() {
    setDemoBusy(true)
    setDemoError(null)
    setDemoStatus('Removing demo data...')
    try {
      await clearAllData()
      setDemoStatus(null)
      navigate('/scan')
    } finally {
      setDemoBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Home"
        title="Dashboard"
        description="Start with the high-level picture, then follow the strongest signals into products, trips, and longer-term behavior."
        actions={
          <>
            <YearPicker />
            {allReceipts.length > 0 && <ImportButton />}
          </>
        }
      />

      {demoStatus && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-costco-blue">
          <Loader2 size={16} className="animate-spin" />
          {demoStatus}
        </div>
      )}

      {demoError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
          <AlertTriangle size={16} />
          {demoError}
        </div>
      )}

      {allReceipts.length === 0 ? (
        <>
          <EmptyDemoOnboarding
            onTryDemo={handleTryDemo}
            onImportOwn={() => navigate('/scan')}
            busy={demoBusy}
          />
          <DropZone />
        </>
      ) : (
        <>
          {demoMode && <DemoModeBanner onStartFresh={handleStartFresh} busy={demoBusy} />}
          <PageSection
            eyebrow="Overview"
            title="What your Costco year looks like"
            description="Use this layer for the quickest read on spend, trip volume, and standout patterns before drilling deeper."
          >
            <div className="space-y-6">
              <SummaryCards />
              <InsightSummary />
            </div>
          </PageSection>

          <PageSection
            eyebrow="Explore"
            title="Choose your next lens"
            description="Each path answers a different question: product relationships, year-over-year movement, or ranked leaders."
          >
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-3">
                <PageActionCard
                  icon={<BarChart3 size={18} />}
                  title="Analysis"
                  description="Explore your product map, spend vs frequency, and detailed purchase histories."
                  accentClassName="bg-blue-50 text-costco-blue"
                  onClick={() => navigate('/analysis')}
                />
                <PageActionCard
                  icon={<TrendingUp size={18} />}
                  title="Trends"
                  description="Compare years, inspect shopping rhythm, and spot monthly or price movement."
                  accentClassName="bg-rose-50 text-rose-600"
                  onClick={() => navigate('/trends')}
                />
                <PageActionCard
                  icon={<Trophy size={18} />}
                  title="Top 10"
                  description="Get fast ranked answers on staples, biggest spenders, emerging patterns, and more."
                  accentClassName="bg-amber-50 text-amber-700"
                  onClick={() => navigate('/top')}
                />
              </div>
              <QuickFind />
            </div>
          </PageSection>

          <PageSection
            eyebrow="Patterns"
            title="Behavior beneath the totals"
            description="These views explain what is becoming habitual, how trips break down, and which products keep showing up together."
          >
            <div className="space-y-6">
              <HabitInsights />
              <TripInsights />
              <BasketInsights />
            </div>
          </PageSection>

          <PageSection
            eyebrow="History"
            title="Recent receipts"
            description="The raw record of where you shopped, what each trip looked like, and what it ultimately cost."
          >
            <div className="bg-surface rounded-xl border">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">
                  Receipts
                  <span className="text-text-3 font-normal ml-1.5">({receipts.length})</span>
                </h3>
                {hasMore && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-sm text-costco-blue hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showAll ? 'Show less' : 'Show all'}
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${showAll ? 'rotate-180' : ''}`}
                    />
                  </button>
                )}
              </div>
              <div>
                {visible.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/receipts/${r.id}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors border-b last:border-b-0 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-red-50 text-costco-red rounded-lg flex items-center justify-center">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{r.warehouseName || 'Costco'}</p>
                        <p className="text-xs text-text-3">
                          {new Date(r.transactionDate + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {' '}&middot; {r.items.length} items
                        </p>
                        {r.transactionBarcode && (
                          <p className="text-xs text-text-3 flex items-center gap-1 mt-0.5">
                            <Hash size={10} />
                            {r.transactionBarcode}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-semibold text-sm">{fmt(r.total)}</span>
                  </button>
                ))}
                {receipts.length === 0 && (
                  <div className="p-8 text-center text-text-3 text-sm">No receipts for this year</div>
                )}
              </div>
            </div>
          </PageSection>
        </>
      )}
    </div>
  )
}
