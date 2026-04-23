import { useState, useMemo } from 'react'
import { Search, ArrowUpDown, Compass, Trophy, TrendingUp } from 'lucide-react'
import { useProductAggregates } from '../hooks/use-products'
import { ProductCard } from '../components/analysis/product-card'
import { SpendFrequencyChart } from '../components/analysis/spend-frequency-chart'
import { InsightPathways, type InsightPathwayItem } from '../components/layout/insight-pathways'
import { PageIntro, PageSection } from '../components/layout/page-shell'
import { YearPicker } from '../components/ui/year-picker'

type SortKey = 'staples' | 'count' | 'spent' | 'recent' | 'name'

export function AnalysisPage() {
  const products = useProductAggregates()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('staples')

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
      case 'staples':
        result = [...result].sort((a, b) => {
          if (b.stapleScore !== a.stapleScore) return b.stapleScore - a.stapleScore
          return b.purchaseMonthsCount - a.purchaseMonthsCount
        })
        break
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

  const topStaple = useMemo(
    () =>
      [...products].sort((a, b) => {
        if (b.stapleScore !== a.stapleScore) return b.stapleScore - a.stapleScore
        return b.purchaseMonthsCount - a.purchaseMonthsCount
      })[0],
    [products],
  )
  const pathways = useMemo<InsightPathwayItem[]>(() => {
    const items: InsightPathwayItem[] = []
    if (topStaple) {
      items.push({
        title: 'Inspect your strongest staple',
        description: `${topStaple.description} is one of your most consistent repeats with ${topStaple.purchaseMonthsCount} active months.`,
        to: `/analysis/${topStaple.itemNumber}`,
        cta: 'Open product detail',
        icon: <Compass size={18} />,
        accentClassName: 'bg-blue-50 text-costco-blue',
      })
    }
    items.push(
      {
        title: 'See how the year is shifting',
        description: 'Jump into Trends for monthly change, shopping rhythm, and biggest price movers.',
        to: '/trends',
        cta: 'Open trends',
        icon: <TrendingUp size={18} />,
        accentClassName: 'bg-rose-50 text-rose-600',
      },
      {
        title: 'Open the leaderboards',
        description: 'Use Top 10 when you want ranked answers fast: biggest spenders, staples, and cooling-off products.',
        to: '/top',
        cta: 'Open Top 10',
        icon: <Trophy size={18} />,
        accentClassName: 'bg-amber-50 text-amber-700',
      },
    )
    return items
  }, [topStaple])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Product Lens"
        title="Analysis"
        description="Use this page to map what you buy most often, what absorbs the most spend, and which products deserve a closer look."
        actions={<YearPicker />}
      />

      {products.length === 0 ? (
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <p className="text-lg font-medium mb-1">No products yet</p>
          <p className="text-sm">Import receipts to see your purchase history</p>
        </div>
      ) : (
        <>
          <PageSection
            eyebrow="Controls"
            title="Find and rank products"
            description="Search by name or item number, then change the sorting lens depending on whether you care about staples, spend, recency, or raw frequency."
          >
            <div className="space-y-4">
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
                  {(['staples', 'count', 'spent', 'recent', 'name'] as SortKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                        sortBy === key
                          ? 'bg-costco-red text-white'
                          : 'bg-surface-3 text-text-2 hover:bg-surface-3/80'
                      }`}
                    >
                      {key === 'staples'
                        ? 'Staples'
                        : key === 'count'
                          ? 'Most Bought'
                          : key === 'spent'
                            ? 'Most Spent'
                            : key === 'recent'
                              ? 'Recently Bought'
                              : 'A-Z'}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-sm text-text-3">
                {filtered.length} products
                {sortBy === 'staples' ? ' · ranked by repeat consistency' : ''}
              </p>
            </div>
          </PageSection>

          {!search && (
            <PageSection
              eyebrow="Signals"
              title="See the biggest forces in the dataset"
              description="Use the pathways for deeper jumps, then read the spend-vs-frequency map to separate staples from occasional splurges."
            >
              <div className="space-y-6">
                <InsightPathways
                  title="Where To Go Next"
                  description="Use Analysis as the map, then jump into rankings or year-over-year movement."
                  items={pathways}
                />

                {filtered.length > 2 && <SpendFrequencyChart products={filtered} />}
              </div>
            </PageSection>
          )}

          {search && filtered.length === 0 && (
            <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
              <p className="text-lg font-medium mb-1">No products matched</p>
              <p className="text-sm">Try a broader product name or an item number.</p>
            </div>
          )}

          {filtered.length > 0 && (
            <PageSection
              eyebrow="Catalog"
              title="Browse the full product set"
              description="This grid is the working surface for drilldowns. Open any product to inspect its price history, cadence, and basket context."
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((product) => (
                  <ProductCard key={product.itemNumber} product={product} searchTerm={search} />
                ))}
              </div>
            </PageSection>
          )}
        </>
      )}
    </div>
  )
}
