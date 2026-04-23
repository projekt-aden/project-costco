import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Minus, Trophy, Compass } from 'lucide-react'
import { useTrends } from '../hooks/use-trends'
import { useReceipts } from '../hooks/use-receipts'
import { MonthlyChart } from '../components/trends/monthly-chart'
import { ShoppingHeatmap } from '../components/trends/shopping-heatmap'
import { MonthComparisonTable } from '../components/trends/month-comparison'
import { PriceMovers } from '../components/trends/price-movers'
import { InsightPathways, type InsightPathwayItem } from '../components/layout/insight-pathways'
import { PageIntro, PageSection } from '../components/layout/page-shell'
import { YearSelect } from '../components/ui/year-select'

export function TrendsPage() {
  const receipts = useReceipts()

  const availableYears = useMemo(() => {
    const years = [...new Set(receipts.map((r) => new Date(r.transactionDate).getFullYear()))]
    return years.sort((a, b) => b - a)
  }, [receipts])

  const [yearB, setYearB] = useState(() => availableYears[0] || new Date().getFullYear())
  const [yearA, setYearA] = useState(() => availableYears[1] || yearB - 1)

  const trends = useTrends(yearA, yearB)

  const inflationIcon = trends.inflationRate === null
    ? <Minus size={20} />
    : trends.inflationRate > 0
    ? <TrendingUp size={20} />
    : trends.inflationRate < 0
    ? <TrendingDown size={20} />
    : <Minus size={20} />

  const inflationColor = trends.inflationRate === null
    ? 'text-text-3'
    : trends.inflationRate > 0
    ? 'text-costco-red'
    : trends.inflationRate < 0
    ? 'text-emerald-600'
    : 'text-text-3'

  const inflationBg = trends.inflationRate === null
    ? 'bg-surface-3'
    : trends.inflationRate > 0
    ? 'bg-red-50'
    : trends.inflationRate < 0
    ? 'bg-emerald-50'
    : 'bg-surface-3'

  const spendColor = trends.totalSpendChange === null
    ? 'text-text-3'
    : trends.totalSpendChange > 0
    ? 'text-costco-red'
    : 'text-emerald-600'
  const pathways = useMemo<InsightPathwayItem[]>(() => {
    const items: InsightPathwayItem[] = []
    if (trends.topIncreases[0]) {
      items.push({
        title: 'Inspect the sharpest price jump',
        description: `${trends.topIncreases[0].description} shows one of the strongest upward moves in ${trends.periodLabel}.`,
        to: `/analysis/${trends.topIncreases[0].itemNumber}`,
        cta: 'Open product detail',
        icon: <Compass size={18} />,
        accentClassName: 'bg-rose-50 text-rose-600',
      })
    }
    items.push(
      {
        title: 'Return to ranked answers',
        description: 'Use Top 10 when you want a leaderboard view of staples, spenders, and products cooling off.',
        to: '/top',
        cta: 'Open Top 10',
        icon: <Trophy size={18} />,
        accentClassName: 'bg-amber-50 text-amber-700',
      },
      {
        title: 'Explore the full product map',
        description: 'Switch to Analysis for the spend-vs-frequency view and deeper product-level drilldowns.',
        to: '/analysis',
        cta: 'Open analysis',
        icon: <TrendingUp size={18} />,
        accentClassName: 'bg-blue-50 text-costco-blue',
      },
    )
    return items
  }, [trends.periodLabel, trends.topIncreases])

  if (receipts.length === 0) {
    return (
      <div className="space-y-6">
        <PageIntro
          eyebrow="Yearly Comparison"
          title="Trends"
          description="Compare one Costco year against another to understand what is shifting in spend, shopping rhythm, and product-level pricing."
        />
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <p className="text-lg font-medium mb-1">No data yet</p>
          <p className="text-sm">Import receipts to see spending trends</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Yearly Comparison"
        title="Trends"
        description="Compare one Costco year against another to understand what is shifting in spend, shopping rhythm, and product-level pricing."
        actions={
          <div className="flex items-center gap-2 text-sm">
            <YearSelect value={yearA} years={availableYears} onChange={setYearA} />
            <span className="text-text-3">vs</span>
            <YearSelect value={yearB} years={availableYears} onChange={setYearB} />
          </div>
        }
      />

      <PageSection
        eyebrow="Snapshot"
        title="What changed between the two years"
        description="These headline cards summarize overall price pressure, total spend movement, and how much shared product overlap exists between the comparison windows."
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface rounded-xl border p-5 col-span-1 sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-9 h-9 ${inflationBg} ${inflationColor} rounded-xl flex items-center justify-center`}>
                {inflationIcon}
              </div>
              <div>
                <p className="text-xs text-text-3">Your Inflation Rate</p>
                <p className="text-xs text-text-3">{trends.periodLabel}</p>
              </div>
            </div>
            <p className={`text-2xl font-bold ${inflationColor}`}>
              {trends.inflationRate !== null
                ? `${trends.inflationRate > 0 ? '+' : ''}${trends.inflationRate}%`
                : '—'}
            </p>
            <p className="text-xs text-text-3 mt-1">
              Weighted avg unit price change across {trends.topIncreases.length + trends.topDecreases.length} items
            </p>
          </div>

          <div className="bg-surface rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-blue-50 text-costco-blue rounded-xl flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <p className="text-xs text-text-3">Total Spend Change</p>
            </div>
            <p className={`text-2xl font-bold ${spendColor}`}>
              {trends.totalSpendChange !== null
                ? `${trends.totalSpendChange > 0 ? '+' : ''}${trends.totalSpendChange}%`
                : '—'}
            </p>
            <p className="text-xs text-text-3 mt-1">{trends.periodLabel}</p>
          </div>

          <div className="bg-surface rounded-xl border p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <ShoppingCart size={20} />
              </div>
              <p className="text-xs text-text-3">Items Compared</p>
            </div>
            <p className="text-2xl font-bold">
              {trends.topIncreases.length + trends.topDecreases.length}
            </p>
            <p className="text-xs text-text-3 mt-1">
              Products purchased in both {yearA} and {yearB}
            </p>
          </div>
        </div>
      </PageSection>

      <PageSection
        eyebrow="Routing"
        title="Follow the strongest movement"
        description="Use these pathways when the comparison view surfaces something worth inspecting at the product or leaderboard level."
      >
        <InsightPathways
          title="Follow The Signal"
          description="Use Trends to spot movement, then jump into the exact products or rankings behind it."
          items={pathways}
        />
      </PageSection>

      <PageSection
        eyebrow="Rhythm"
        title="How shopping activity unfolds over time"
        description="Read these views together: the line chart shows spend by month, the heatmap shows shopping cadence, and the table reveals which months changed the most."
      >
        <div className="space-y-6">
          <MonthlyChart
            data={trends.monthlySpend}
            years={availableYears.slice().sort()}
          />

          <ShoppingHeatmap
            days={trends.shoppingDays}
            years={[yearA, yearB]}
          />

          <MonthComparisonTable
            comparisons={trends.monthComparisons}
            yearA={yearA}
            yearB={yearB}
          />
        </div>
      </PageSection>

      <PageSection
        eyebrow="Movers"
        title="Products driving the sharpest changes"
        description="This is the fastest way to see which items are materially pushing prices up or down across the selected years."
      >
        <PriceMovers
          increases={trends.topIncreases}
          decreases={trends.topDecreases}
          periodLabel={trends.periodLabel}
        />
      </PageSection>
    </div>
  )
}
