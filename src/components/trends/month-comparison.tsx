import type { MonthComparison } from '../../lib/trends'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function MonthComparisonTable({
  comparisons,
  yearA,
  yearB,
}: {
  comparisons: MonthComparison[]
  yearA: number
  yearB: number
}) {
  if (comparisons.length === 0) return null

  return (
    <div className="bg-surface rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <h4 className="font-semibold">Month-by-Month Comparison</h4>
        <p className="text-sm text-text-3 mt-1">
          See where the year changed shape, not just the total at the end.
        </p>
      </div>

      <div className="divide-y">
        {comparisons.map((comparison) => {
          const tone =
            comparison.changePercent === null
              ? 'text-text-3'
              : comparison.changePercent > 0
                ? 'text-costco-red'
                : comparison.changePercent < 0
                  ? 'text-emerald-600'
                  : 'text-text'

          return (
            <div
              key={comparison.month}
              className="grid grid-cols-[64px,1fr,1fr,80px] gap-3 p-3 text-sm items-center"
            >
              <div className="font-medium">{comparison.label}</div>
              <div>
                <div className="text-xs text-text-3">{yearA}</div>
                <div className="font-medium">{fmt(comparison.spendA)}</div>
              </div>
              <div>
                <div className="text-xs text-text-3">{yearB}</div>
                <div className="font-medium">{fmt(comparison.spendB)}</div>
              </div>
              <div className={`text-right font-semibold ${tone}`}>
                {comparison.changePercent === null
                  ? '—'
                  : `${comparison.changePercent > 0 ? '+' : ''}${comparison.changePercent}%`}
                <div className="text-[11px] text-text-3 font-normal">
                  {comparison.tripDelta > 0 ? '+' : ''}
                  {comparison.tripDelta} trips
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
