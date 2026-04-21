import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { matchCategory } from '../../lib/product-categories'
import type { ProductAggregate } from '../../types/product'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function ProductCard({ product }: { product: ProductAggregate }) {
  const navigate = useNavigate()
  const cat = matchCategory(product.description)
  const Icon = cat.icon

  return (
    <button
      onClick={() => navigate(`/analysis/${product.itemNumber}`)}
      className="bg-surface rounded-xl border hover:border-costco-red/30 hover:shadow-md transition-all cursor-pointer text-left overflow-hidden group"
    >
      <div className="p-3 space-y-2">
        {/* Icon + description */}
        <div className="flex items-start gap-2.5">
          <div className={`w-9 h-9 ${cat.bg} ${cat.color} rounded-lg flex items-center justify-center shrink-0`}>
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-tight line-clamp-2">
              {product.description}
            </p>
            <p className="text-xs text-text-3 mt-0.5">#{product.itemNumber}</p>
          </div>
        </div>

        {/* Stats */}
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
