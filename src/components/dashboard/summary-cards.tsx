import { useMemo } from 'react'
import { DollarSign, Receipt, TrendingUp, Percent } from 'lucide-react'
import { useFilteredReceipts } from '../../hooks/use-year-filter'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function SummaryCards() {
  const receipts = useFilteredReceipts()

  const { totalSpent, totalTax, totalSubtotal, receiptCount } = useMemo(() => {
    const totalSpent = receipts.reduce((s, r) => s + r.total, 0)
    const totalTax = receipts.reduce((s, r) => s + r.tax, 0)
    const totalSubtotal = receipts.reduce((s, r) => s + r.subtotal, 0)
    return {
      totalSpent: Math.round(totalSpent * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      totalSubtotal: Math.round(totalSubtotal * 100) / 100,
      receiptCount: receipts.length,
    }
  }, [receipts])

  const avgPerTrip = receiptCount > 0 ? totalSpent / receiptCount : 0
  const taxRate = totalSubtotal > 0 ? (totalTax / totalSubtotal) * 100 : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={<DollarSign size={20} />}
        label="Total Spent"
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
        value={fmt(avgPerTrip)}
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
