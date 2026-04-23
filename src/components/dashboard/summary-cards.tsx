import { DollarSign, Receipt, TrendingUp, Percent, Package, CalendarDays } from 'lucide-react'
import { useFilteredReceipts } from '../../hooks/use-year-filter'
import { computeSummaryMetrics } from '../../lib/analytics'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function SummaryCards() {
  const receipts = useFilteredReceipts()
  const { totalSpent, totalTax, totalSubtotal, receiptCount, averagePerTrip, uniqueItems, busiestMonth } =
    computeSummaryMetrics(receipts)
  const taxRate = totalSubtotal > 0 ? (totalTax / totalSubtotal) * 100 : 0

  return (
    <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
      <Card
        icon={<DollarSign size={20} />}
        label="Spend"
        value={fmt(totalSpent)}
        color="text-costco-red"
        bg="bg-red-50"
      />
      <Card
        icon={<Receipt size={20} />}
        label="Receipts"
        value={receiptCount.toString()}
        color="text-costco-blue"
        bg="bg-blue-50"
      />
      <Card
        icon={<TrendingUp size={20} />}
        label="Avg per Trip"
        value={fmt(averagePerTrip)}
        color="text-emerald-600"
        bg="bg-emerald-50"
      />
      <Card
        icon={<Percent size={20} />}
        label="Total Tax"
        value={fmt(totalTax)}
        sub={`${taxRate.toFixed(1)}% rate`}
        color="text-amber-600"
        bg="bg-amber-50"
      />
      <Card
        icon={<Package size={20} />}
        label="Unique Items"
        value={uniqueItems.toLocaleString()}
        color="text-violet-600"
        bg="bg-violet-50"
      />
      <Card
        icon={<CalendarDays size={20} />}
        label="Busiest Month"
        value={busiestMonth || '—'}
        color="text-costco-blue"
        bg="bg-sky-50"
      />
    </div>
  )
}

function Card({
  icon, label, value, sub, color, bg,
}: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; bg: string
}) {
  return (
    <div className="bg-surface rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${bg} ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm text-text-2">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
    </div>
  )
}
