import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trophy, Flame, DollarSign, TrendingUp, Star, Undo2,
} from 'lucide-react'
import { useProductAggregates } from '../hooks/use-products'
import { YearPicker } from '../components/ui/year-picker'
import type { ProductAggregate } from '../types/product'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

interface TopCategory {
  id: string
  title: string
  icon: React.ReactNode
  color: string
  bg: string
  items: TopItem[]
  valueLabel: (item: TopItem) => string
  subLabel?: (item: TopItem) => string
}

interface TopItem {
  product: ProductAggregate
  value: number
}

export function TopPage() {
  const products = useProductAggregates()
  const navigate = useNavigate()

  const categories = useMemo((): TopCategory[] => {
    if (products.length === 0) return []

    const nonFuel = products.filter((p) => !p.totalGallons)
    const regular = nonFuel.filter((p) => p.totalSpent >= 0)
    const returns = nonFuel.filter((p) => p.totalSpent < 0)

    const mostPurchased = [...regular]
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 10)
      .map((p) => ({ product: p, value: p.purchaseCount }))

    const mostExpensive = [...regular]
      .filter((p) => p.prices.some((x) => x.unitPrice > 0))
      .sort((a, b) => {
        const pos = (arr: typeof a.prices) => arr.filter((x) => x.unitPrice > 0)
        const avgA = pos(a.prices).reduce((s, x) => s + x.unitPrice, 0) / pos(a.prices).length
        const avgB = pos(b.prices).reduce((s, x) => s + x.unitPrice, 0) / pos(b.prices).length
        return avgB - avgA
      })
      .slice(0, 10)
      .map((p) => {
        const pos = p.prices.filter((x) => x.unitPrice > 0)
        return { product: p, value: pos.reduce((s, x) => s + x.unitPrice, 0) / pos.length }
      })

    const biggestSpenders = [...regular]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10)
      .map((p) => ({ product: p, value: p.totalSpent }))

    const loyal = [...regular]
      .map((p) => {
        const months = new Set(p.purchases.map((x) => x.date.slice(0, 7)))
        return { product: p, value: months.size }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const priceJumps = [...regular]
      .filter((p) => p.prices.filter((x) => x.unitPrice > 0).length >= 2)
      .map((p) => {
        const pos = p.prices.filter((x) => x.unitPrice > 0)
        const first = pos[0].unitPrice
        const last = pos[pos.length - 1].unitPrice
        const change = first > 0 ? ((last - first) / first) * 100 : 0
        return { product: p, value: Math.round(change * 10) / 10 }
      })
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const topReturns = [...returns]
      .sort((a, b) => a.totalSpent - b.totalSpent)
      .slice(0, 10)
      .map((p) => ({ product: p, value: Math.abs(p.totalSpent) }))

    return [
      {
        id: 'most-purchased',
        title: 'Most Purchased',
        icon: <Flame size={18} />,
        color: 'text-costco-red',
        bg: 'bg-red-50',
        items: mostPurchased,
        valueLabel: (item: TopItem) => `${item.value}x`,
      },
      {
        id: 'biggest-spenders',
        title: 'Money Pits',
        icon: <DollarSign size={18} />,
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        items: biggestSpenders,
        valueLabel: (item: TopItem) => fmt(item.value),
        subLabel: (item: TopItem) => `${item.product.purchaseCount}x bought`,
      },
      {
        id: 'most-expensive',
        title: 'Priciest Items',
        icon: <Trophy size={18} />,
        color: 'text-violet-600',
        bg: 'bg-violet-50',
        items: mostExpensive,
        valueLabel: (item: TopItem) => fmt(item.value),
        subLabel: () => 'avg unit price',
      },
      {
        id: 'loyal',
        title: 'Costco Staples',
        icon: <Star size={18} />,
        color: 'text-costco-blue',
        bg: 'bg-blue-50',
        items: loyal,
        valueLabel: (item: TopItem) => `${item.value} months`,
        subLabel: (item: TopItem) => `${item.product.purchaseCount}x total`,
      },
      {
        id: 'price-jumps',
        title: 'Biggest Price Hikes',
        icon: <TrendingUp size={18} />,
        color: 'text-rose-600',
        bg: 'bg-rose-50',
        items: priceJumps,
        valueLabel: (item: TopItem) => `+${item.value}%`,
        subLabel: (item: TopItem) => {
          const pos = item.product.prices.filter((price) => price.unitPrice > 0)
          return `${fmt(pos[0].unitPrice)} → ${fmt(pos[pos.length - 1].unitPrice)}`
        },
      },
      {
        id: 'returns',
        title: 'Returns',
        icon: <Undo2 size={18} />,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        items: topReturns,
        valueLabel: (item: TopItem) => `-${fmt(item.value)}`,
        subLabel: (item: TopItem) => `${item.product.purchaseCount}x returned`,
      },
    ].filter((c) => c.items.length > 0)
  }, [products])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Top 10</h2>
        <YearPicker />
      </div>

      {categories.length === 0 ? (
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No data yet</p>
          <p className="text-sm">Import receipts to see your top items</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-surface rounded-xl border overflow-hidden">
              <div className="p-4 border-b flex items-center gap-2.5">
                <div className={`w-8 h-8 ${cat.bg} ${cat.color} rounded-lg flex items-center justify-center`}>
                  {cat.icon}
                </div>
                <h3 className="font-semibold">{cat.title}</h3>
              </div>

              <div>
                {cat.items.map((item, rank) => (
                  <button
                    key={item.product.itemNumber}
                    onClick={() => navigate(`/analysis/${item.product.itemNumber}`)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-surface-3 transition-colors cursor-pointer border-b last:border-b-0"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      rank === 0 ? `${cat.bg} ${cat.color}` :
                      rank < 3 ? 'bg-surface-3 text-text' :
                      'bg-transparent text-text-3'
                    }`}>
                      {rank + 1}
                    </div>

                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium truncate">{item.product.description}</p>
                      {cat.subLabel && (
                        <p className="text-xs text-text-3">{cat.subLabel(item)}</p>
                      )}
                    </div>

                    <span className={`text-sm font-bold tabular-nums shrink-0 ${rank < 3 ? cat.color : 'text-text'}`}>
                      {cat.valueLabel(item)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
