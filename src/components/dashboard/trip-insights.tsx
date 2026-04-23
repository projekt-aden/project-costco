import { Fuel, ShoppingBasket, ShoppingCart, Package2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFilteredReceipts } from '../../hooks/use-year-filter'
import { computeTripBehavior } from '../../lib/trips'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const ARCHETYPE_META = {
  'gas-stop': { label: 'Gas Stops', icon: <Fuel size={16} />, color: 'text-amber-700', bg: 'bg-amber-50' },
  'quick-refill': { label: 'Quick Refills', icon: <ShoppingCart size={16} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'big-haul': { label: 'Big Hauls', icon: <ShoppingBasket size={16} />, color: 'text-costco-red', bg: 'bg-red-50' },
  'stock-up': { label: 'Stock-Ups', icon: <Package2 size={16} />, color: 'text-violet-600', bg: 'bg-violet-50' },
  'mixed-run': { label: 'Mixed Runs', icon: <ShoppingBasket size={16} />, color: 'text-costco-blue', bg: 'bg-blue-50' },
} as const

export function TripInsights() {
  const receipts = useFilteredReceipts()
  const navigate = useNavigate()
  const behavior = computeTripBehavior(receipts)

  if (behavior.profiles.length === 0) return null

  const topArchetypes = Object.entries(behavior.counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold">Trip Patterns</h3>
        <p className="text-sm text-text-3 mt-1">
          A snapshot of how your Costco visits break down, from quick refills to full stock-up runs.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="bg-surface rounded-xl border p-4 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <MiniMetric label="Avg Basket" value={fmt(behavior.averageBasketSpend)} />
            <MiniMetric label="Avg Unique Items" value={behavior.averageUniqueItems.toFixed(1)} />
            <MiniMetric
              label="Dominant Pattern"
              value={topArchetypes.length > 0 ? ARCHETYPE_META[topArchetypes[0][0] as keyof typeof ARCHETYPE_META].label : '—'}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {topArchetypes.map(([key, count]) => {
              const meta = ARCHETYPE_META[key as keyof typeof ARCHETYPE_META]
              return (
                <div key={key} className="rounded-xl border bg-surface-2 p-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${meta.bg} ${meta.color}`}>
                      {meta.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-text-3">{count} trips</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-surface rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h4 className="font-semibold">Trip Highlights</h4>
          </div>
          <div className="p-3 space-y-3">
            {behavior.biggestHaul && (
              <HighlightCard
                title="Biggest Haul"
                subtitle={`${behavior.biggestHaul.uniqueItems} items · ${behavior.biggestHaul.totalUnits} total units`}
                value={fmt(behavior.biggestHaul.total)}
                meta={behavior.biggestHaul.receipt.transactionDate}
                onClick={() => navigate(`/receipts/${behavior.biggestHaul?.receipt.id}`)}
              />
            )}
            {behavior.quickestRefill && (
              <HighlightCard
                title="Quickest Refill"
                subtitle={`${behavior.quickestRefill.uniqueItems} items · ${behavior.quickestRefill.label}`}
                value={fmt(behavior.quickestRefill.total)}
                meta={behavior.quickestRefill.receipt.transactionDate}
                onClick={() => navigate(`/receipts/${behavior.quickestRefill?.receipt.id}`)}
              />
            )}
            {behavior.latestStockUp && (
              <HighlightCard
                title="Latest Stock-Up"
                subtitle={`${behavior.latestStockUp.uniqueItems} items · max qty ${behavior.latestStockUp.maxQuantity}`}
                value={fmt(behavior.latestStockUp.total)}
                meta={behavior.latestStockUp.receipt.transactionDate}
                onClick={() => navigate(`/receipts/${behavior.latestStockUp?.receipt.id}`)}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-3">
      <div className="text-xs text-text-3">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  )
}

function HighlightCard({
  title,
  subtitle,
  value,
  meta,
  onClick,
}: {
  title: string
  subtitle: string
  value: string
  meta: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border bg-surface-2 p-3 text-left hover:border-costco-red/25 hover:bg-surface transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-text-3 mt-0.5">{subtitle}</p>
          <p className="text-xs text-text-3 mt-1">{meta}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-semibold">{value}</p>
          <ArrowRight size={14} className="text-text-3 ml-auto mt-2" />
        </div>
      </div>
    </button>
  )
}
