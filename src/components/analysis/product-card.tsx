import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { matchCategory } from '../../lib/product-categories'
import { normalizeSearchText } from '../../lib/analytics'
import type { ProductAggregate } from '../../types/product'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function ProductCard({
  product,
  searchTerm = '',
}: {
  product: ProductAggregate
  searchTerm?: string
}) {
  const navigate = useNavigate()
  const cat = matchCategory(product.description)
  const Icon = cat.icon
  const normalizedSearch = normalizeSearchText(searchTerm)
  const highlightedDescription =
    normalizedSearch && normalizeSearchText(product.description).includes(normalizedSearch)
      ? highlight(product.description, searchTerm)
      : product.description

  return (
    <button
      onClick={() => navigate(`/analysis/${product.itemNumber}`)}
      className="bg-surface rounded-xl border hover:border-costco-red/30 hover:shadow-md transition-all cursor-pointer text-left overflow-hidden group"
    >
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2.5">
          <div className={`w-9 h-9 ${cat.bg} ${cat.color} rounded-lg flex items-center justify-center shrink-0`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight line-clamp-2">
              {highlightedDescription}
            </p>
            <p className="text-xs text-text-3 mt-0.5">#{product.itemNumber}</p>
            <p className="text-xs text-text-3 mt-1">
              {product.purchaseMonthsCount} active months
              {product.averageDaysBetweenPurchases !== null
                ? ` · ~${Math.round(product.averageDaysBetweenPurchases)} days between buys`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-text-2">
            <ShoppingCart size={12} />
            <span>{product.purchaseCount}x</span>
          </div>
          <span className="text-sm font-semibold">{fmt(product.totalSpent)}</span>
        </div>
      </div>
    </button>
  )
}

function highlight(text: string, query: string) {
  const trimmed = query.trim()
  if (!trimmed) return text

  const index = text.toLowerCase().indexOf(trimmed.toLowerCase())
  if (index < 0) return text

  const before = text.slice(0, index)
  const match = text.slice(index, index + trimmed.length)
  const after = text.slice(index + trimmed.length)

  return (
    <>
      {before}
      <mark className="rounded bg-amber-100 px-0.5 text-inherit">{match}</mark>
      {after}
    </>
  )
}
