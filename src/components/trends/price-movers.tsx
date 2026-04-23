import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { PriceMover } from '../../lib/trends'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function PriceMovers({
  increases,
  decreases,
  periodLabel,
}: {
  increases: PriceMover[]
  decreases: PriceMover[]
  periodLabel: string
}) {
  if (increases.length === 0 && decreases.length === 0) {
    return (
      <div className="bg-surface rounded-xl border p-6 text-center text-text-3 text-sm">
        Not enough data to compare prices between periods
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <MoverList
        title="Biggest Increases"
        icon={<TrendingUp size={16} />}
        items={increases}
        periodLabel={periodLabel}
        color="text-costco-red"
        bgColor="bg-red-50"
        badgeColor="bg-red-100 text-costco-red"
      />
      <MoverList
        title="Biggest Decreases"
        icon={<TrendingDown size={16} />}
        items={decreases}
        periodLabel={periodLabel}
        color="text-emerald-600"
        bgColor="bg-emerald-50"
        badgeColor="bg-emerald-100 text-emerald-700"
      />
    </div>
  )
}

function MoverList({
  title,
  icon,
  items,
  periodLabel,
  color,
  bgColor,
  badgeColor,
}: {
  title: string
  icon: React.ReactNode
  items: PriceMover[]
  periodLabel: string
  color: string
  bgColor: string
  badgeColor: string
}) {
  const navigate = useNavigate()

  return (
    <div className="bg-surface rounded-xl border overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <div className={`w-7 h-7 ${bgColor} ${color} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-sm">{title}</h4>
          <p className="text-xs text-text-3">{periodLabel}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div className="p-4 text-sm text-text-3 text-center">No items</div>
      ) : (
        <div className="divide-y">
          {items.map((item) => (
            <button
              key={item.itemNumber}
              onClick={() => navigate(`/analysis/${item.itemNumber}`)}
              className="w-full flex items-center justify-between p-3 hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{item.description}</p>
                <p className="text-xs text-text-3">
                  {fmt(item.oldPrice)} → {fmt(item.newPrice)}
                </p>
              </div>
              <span className={`ml-3 shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${badgeColor}`}>
                {item.changePercent > 0 ? '+' : ''}{item.changePercent}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
