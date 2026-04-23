import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShoppingCart, Calendar, MapPin, DollarSign, TrendingUp, Hash, Repeat } from 'lucide-react'
import { useFilteredReceipts } from '../hooks/use-year-filter'
import { useProductAggregate } from '../hooks/use-products'
import { PriceChart } from '../components/analysis/price-chart'
import { buildProductHabitCollections } from '../lib/analytics'
import { computeProductCompanions } from '../lib/baskets'
import { matchCategory } from '../lib/product-categories'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function ProductDetailPage() {
  const { itemNumber } = useParams<{ itemNumber: string }>()
  const navigate = useNavigate()
  const receipts = useFilteredReceipts()
  const product = useProductAggregate(itemNumber || '')
  const cat = product ? matchCategory(product.description) : null

  if (!product) {
    return (
      <div className="text-center py-16">
        <p className="text-text-3 mb-4">Product not found</p>
        <button
          onClick={() => navigate('/analysis')}
          className="text-costco-blue hover:underline cursor-pointer"
        >
          Back to analysis
        </button>
      </div>
    )
  }

  const avgUnitPrice =
    product.prices.length > 0
      ? product.prices.reduce((s, p) => s + p.unitPrice, 0) / product.prices.length
      : 0
  const habitCollections = buildProductHabitCollections([product])
  const habitInsight =
    habitCollections.coreStaples[0] ||
    habitCollections.emergingStaples[0] ||
    habitCollections.coolingOff[0] ||
    null
  const companions = computeProductCompanions(receipts, product.itemNumber)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-3 transition-colors cursor-pointer mt-1"
        >
          <ArrowLeft size={18} />
        </button>
        {cat && (
          <div className={`w-10 h-10 ${cat.bg} ${cat.color} rounded-xl flex items-center justify-center shrink-0`}>
            <cat.icon size={22} />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold">{product.description}</h2>
          <p className="text-sm text-text-3">#{product.itemNumber}{cat ? ` · ${cat.label}` : ''}</p>
          {habitInsight && (
            <p className="text-sm text-text-2 mt-2">
              <span className="inline-flex rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-text">
                {habitInsight.label}
              </span>
              <span className="ml-2 text-sm">{habitInsight.description}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Stat
              icon={<ShoppingCart size={16} />}
              label="Total Purchases"
              value={`${product.purchaseCount}x`}
              sub={product.totalGallons > 0 ? `${product.totalGallons.toFixed(1)} gal` : undefined}
              color="text-costco-blue"
              bg="bg-blue-50"
            />
            <Stat
              icon={<DollarSign size={16} />}
              label="Total Spent"
              value={fmt(product.totalSpent)}
              color="text-costco-red"
              bg="bg-red-50"
            />
            <Stat
              icon={<TrendingUp size={16} />}
              label="Avg Unit Price"
              value={fmt(avgUnitPrice)}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <Stat
              icon={<Calendar size={16} />}
              label="Last Purchased"
              value={new Date(product.lastPurchased + 'T00:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <Stat
              icon={<Repeat size={16} />}
              label="Typical Rebuy"
              value={
                product.averageDaysBetweenPurchases !== null
                  ? `~${Math.round(product.averageDaysBetweenPurchases)} days`
                  : '—'
              }
              sub={`${product.purchaseMonthsCount} active months`}
              color="text-violet-600"
              bg="bg-violet-50"
            />
          </div>
      </div>

      {/* Price Chart */}
      <PriceChart prices={product.prices} />

      {/* Purchase History */}
      <div className="bg-surface rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Purchase History ({product.purchases.length})</h3>
        </div>
        <div className="divide-y">
          {product.purchases.map((p, i) => (
            <button
              key={i}
              onClick={() => navigate(`/receipts/${p.receiptId}`)}
              className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-red-50 text-costco-red rounded-lg flex items-center justify-center">
                  <MapPin size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">{p.warehouse || 'Costco'}</p>
                  <p className="text-xs text-text-3">
                    {new Date(p.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {p.quantity > 1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-costco-blue text-xs font-medium">
                    <Hash size={10} />{p.quantity}
                  </span>
                )}
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{fmt(p.total)}</p>
                  <p className="text-xs text-emerald-600 font-medium tabular-nums">
                    {fmt(p.unitPrice)}<span className="text-text-3 font-normal"> /ea</span>
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {companions.length > 0 && (
        <div className="bg-surface rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Often Bought Together</h3>
          </div>
          <div className="divide-y">
            {companions.map((companion) => (
              <button
                key={companion.itemNumber}
                onClick={() => navigate(`/analysis/${companion.itemNumber}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium truncate">{companion.description}</p>
                  <p className="text-xs text-text-3 mt-0.5">
                    #{companion.itemNumber} · {companion.pairCount} shared trips
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold">{companion.togetherRate}%</p>
                  <p className="text-xs text-text-3">of this item's trips</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; bg: string
}) {
  return (
    <div className="bg-surface rounded-xl border p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={`w-7 h-7 ${bg} ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs text-text-3">{label}</span>
      </div>
      <p className="text-base font-bold">{value}</p>
      {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
    </div>
  )
}
