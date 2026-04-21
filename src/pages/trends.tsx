import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Minus } from 'lucide-react'
import { useTrends } from '../hooks/use-trends'
import { useReceipts } from '../hooks/use-receipts'
import { MonthlyChart } from '../components/trends/monthly-chart'
import { PriceMovers } from '../components/trends/price-movers'
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

  if (receipts.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Trends</h2>
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <p className="text-lg font-medium mb-1">No data yet</p>
          <p className="text-sm">Import receipts to see spending trends</p>
        </div>
      </div>
    )
  }

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

  return (
    <div className="space-y-6">
      {/* Header + Year selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Trends</h2>
        <div className="flex items-center gap-2 text-sm">
          <YearSelect value={yearA} years={availableYears} onChange={setYearA} />
          <span className="text-text-3">vs</span>
          <YearSelect value={yearB} years={availableYears} onChange={setYearB} />
        </div>
      </div>

      {/* Headline cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Personal Inflation Rate */}
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

        {/* Total Spend Change */}
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

        {/* Items Tracked */}
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

      {/* Monthly Spend Chart */}
      <MonthlyChart
        data={trends.monthlySpend}
        years={availableYears.slice().sort()}
      />

      {/* Price Movers */}
      <PriceMovers
        increases={trends.topIncreases}
        decreases={trends.topDecreases}
        periodLabel={trends.periodLabel}
      />
    </div>
  )
}
