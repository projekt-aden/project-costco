import { useState, useMemo } from 'react'
import { Search, ArrowUpDown } from 'lucide-react'
import { useProductAggregates } from '../hooks/use-products'
import { ProductCard } from '../components/analysis/product-card'
import { YearPicker } from '../components/ui/year-picker'

type SortKey = 'count' | 'spent' | 'recent' | 'name'

export function AnalysisPage() {
  const products = useProductAggregates()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('count')

  const filtered = useMemo(() => {
    let result = products

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.description.toLowerCase().includes(q) ||
          p.itemNumber.includes(q)
      )
    }

    switch (sortBy) {
      case 'count':
        result = [...result].sort((a, b) => b.purchaseCount - a.purchaseCount)
        break
      case 'spent':
        result = [...result].sort((a, b) => b.totalSpent - a.totalSpent)
        break
      case 'recent':
        result = [...result].sort((a, b) => b.lastPurchased.localeCompare(a.lastPurchased))
        break
      case 'name':
        result = [...result].sort((a, b) => a.description.localeCompare(b.description))
        break
    }

    return result
  }, [products, search, sortBy])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Analysis</h2>
        <YearPicker />
      </div>

      {products.length === 0 ? (
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <p className="text-lg font-medium mb-1">No products yet</p>
          <p className="text-sm">Import receipts to see your purchase history</p>
        </div>
      ) : (
        <>
          {/* Search + Sort */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface border rounded-xl text-sm outline-none focus:border-costco-red/40 transition-colors"
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <ArrowUpDown size={14} className="text-text-3" />
              {(['count', 'spent', 'recent', 'name'] as SortKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setSortBy(key)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                    sortBy === key
                      ? 'bg-costco-red text-white'
                      : 'bg-surface-3 text-text-2 hover:bg-surface-3/80'
                  }`}
                >
                  {key === 'count' ? 'Purchases' : key === 'spent' ? 'Total $' : key === 'recent' ? 'Recent' : 'A-Z'}
                </button>
              ))}
            </div>
          </div>

          <p className="text-sm text-text-3">{filtered.length} products</p>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product) => (
              <ProductCard key={product.itemNumber} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
