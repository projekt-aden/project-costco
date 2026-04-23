import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trophy, Flame, DollarSign, TrendingUp, Star, Undo2, Sparkles, Snowflake, BarChart3, Compass,
} from 'lucide-react'
import { useProductAggregates } from '../hooks/use-products'
import { buildProductHabitCollections } from '../lib/analytics'
import { InsightPathways, type InsightPathwayItem } from '../components/layout/insight-pathways'
import { PageIntro, PageSection } from '../components/layout/page-shell'
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
      .map((p) => ({ product: p, value: p.purchaseMonthsCount }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const habits = buildProductHabitCollections(regular)
    const emerging = habits.emergingStaples
      .slice(0, 10)
      .map((insight) => ({ product: insight.product, value: insight.product.purchaseCount }))
    const coolingOff = habits.coolingOff
      .slice(0, 10)
      .map((insight) => ({ product: insight.product, value: insight.product.daysSinceLastPurchase }))

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
      {
        id: 'emerging',
        title: 'Emerging Staples',
        icon: <Sparkles size={18} />,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        items: emerging,
        valueLabel: (item: TopItem) => `${item.value}x`,
        subLabel: (item: TopItem) => `${item.product.purchaseMonthsCount} months active`,
      },
      {
        id: 'cooling-off',
        title: 'Cooling Off',
        icon: <Snowflake size={18} />,
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        items: coolingOff,
        valueLabel: (item: TopItem) => `${item.value}d`,
        subLabel: (item: TopItem) => `last seen ${item.product.lastPurchased}`,
      },
    ].filter((c) => c.items.length > 0)
  }, [products])

  const topStaple = categories.find((category) => category.id === 'loyal')?.items[0]?.product
  const topSpender = categories.find((category) => category.id === 'biggest-spenders')?.items[0]?.product
  const pathways = useMemo<InsightPathwayItem[]>(() => {
    const items: InsightPathwayItem[] = []
    if (topStaple) {
      items.push({
        title: 'Open your leading staple',
        description: `${topStaple.description} is one of your most persistent repeat purchases in this view.`,
        to: `/analysis/${topStaple.itemNumber}`,
        cta: 'View product detail',
        icon: <Compass size={18} />,
        accentClassName: 'bg-blue-50 text-costco-blue',
      })
    }
    if (topSpender) {
      items.push({
        title: 'Inspect your biggest spender',
        description: `${topSpender.description} absorbs a large share of your Costco budget and deserves a closer look.`,
        to: `/analysis/${topSpender.itemNumber}`,
        cta: 'Inspect spend history',
        icon: <DollarSign size={18} />,
        accentClassName: 'bg-amber-50 text-amber-700',
      })
    }
    items.push({
      title: 'See movement over time',
      description: 'Switch to Trends to compare months, shopping rhythm, and biggest price movers across years.',
      to: '/trends',
      cta: 'Open trends',
      icon: <BarChart3 size={18} />,
      accentClassName: 'bg-rose-50 text-rose-600',
    })
    return items
  }, [topSpender, topStaple])

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Leaderboards"
        title="Top 10"
        description="Use ranked views when you want fast answers: your biggest staples, biggest spenders, steepest price hikes, and the products losing momentum."
        actions={<YearPicker />}
      />

      {categories.length === 0 ? (
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <Trophy size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No data yet</p>
          <p className="text-sm">Import receipts to see your top items</p>
        </div>
      ) : (
        <>
          <PageSection
            eyebrow="Routing"
            title="Use rankings to pivot"
            description="Top 10 is the quickest entry point when you want a strong answer fast, then a clean jump into deeper product or trend analysis."
          >
            <InsightPathways
              title="Use Rankings To Pivot"
              description="Top 10 gives ranked answers fast. Jump from leaderboards into deeper trend or product analysis."
              items={pathways}
            />
          </PageSection>

          <PageSection
            eyebrow="Boards"
            title="Ranked views of your strongest signals"
            description="Each leaderboard answers a different question about your Costco behavior, from repeat staples to money sinks to products that may be fading."
          >
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
          </PageSection>
        </>
      )}
    </div>
  )
}
