import { useState } from 'react'
import { computeProductPriceSummary } from '../../lib/analytics'
import type { PricePoint } from '../../types/product'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function dateToTs(date: string): number {
  return new Date(date + 'T00:00:00').getTime()
}

function formatMonth(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

function formatFull(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PriceChart({ prices }: { prices: PricePoint[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (prices.length === 0) return null

  const summary = computeProductPriceSummary(prices)
  if (!summary) return null
  const minPrice = summary.minPrice
  const maxPrice = summary.maxPrice
  const isStablePrice = minPrice === maxPrice
  const pricePad = isStablePrice ? minPrice * 0.15 || 1 : (maxPrice - minPrice) * 0.1 || 0.5
  const yMin = minPrice - pricePad
  const yMax = maxPrice + pricePad
  const yRange = yMax - yMin

  // Time-based X axis
  const timestamps = prices.map((p) => dateToTs(p.date))
  const tMin = timestamps[0]
  const tMax = timestamps[timestamps.length - 1]
  const tRange = tMax - tMin || 1

  const W = 560
  const H = 240
  const PX = 52
  const PR = 16
  const PY = 16
  const PB = 32
  const chartW = W - PX - PR
  const chartH = H - PY - PB

  const points = prices.map((p, i) => {
    const x = PX + ((timestamps[i] - tMin) / tRange) * chartW
    const y = PY + chartH - ((p.unitPrice - yMin) / yRange) * chartH
    return { x, y, ...p }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')

  const fillD = `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${H - PB} L ${points[0].x.toFixed(1)} ${H - PB} Z`

  // Y-axis: 4 evenly spaced labels
  const ySteps = 4
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => yMin + (yRange / ySteps) * i)

  // X-axis: month boundaries
  const monthLabels: { x: number; label: string }[] = []
  const seenMonths = new Set<string>()
  for (let i = 0; i < prices.length; i++) {
    const key = prices[i].date.slice(0, 7) // YYYY-MM
    if (!seenMonths.has(key)) {
      seenMonths.add(key)
      monthLabels.push({ x: points[i].x, label: formatMonth(prices[i].date) })
    }
  }
  // Thin out labels if too many — keep every Nth so they don't overlap
  const maxXLabels = Math.floor(chartW / 50)
  const xStep = Math.max(1, Math.ceil(monthLabels.length / maxXLabels))
  const visibleMonths = monthLabels.filter((_, i) => i % xStep === 0)

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null
  const averageY = PY + chartH - ((summary.averagePrice - yMin) / yRange) * chartH
  const latestPoint = points[points.length - 1]
  const bestPoint = points.find((point) => point.unitPrice === minPrice) || points[0]

  return (
    <div className="bg-surface rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Unit Price History</h4>
        <span className="text-xs text-text-3">{prices.length} data points</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e21836" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#e21836" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y grid + labels */}
        {yLabels.map((val, i) => {
          const y = PY + chartH - ((val - yMin) / yRange) * chartH
          return (
            <g key={`y-${i}`}>
              <line x1={PX} y1={y} x2={W - PR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PX - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-[#94a3b8]">
                {fmt(val)}
              </text>
            </g>
          )
        })}

        <line
          x1={PX}
          y1={averageY}
          x2={W - PR}
          y2={averageY}
          stroke="#10b981"
          strokeWidth="1.5"
          strokeDasharray="4,4"
          opacity="0.8"
        />
        <text
          x={W - PR}
          y={averageY - 6}
          textAnchor="end"
          className="text-[10px] fill-[#10b981]"
        >
          Avg {fmt(summary.averagePrice)}
        </text>

        {/* X month labels */}
        {visibleMonths.map((m, i) => (
          <text
            key={`x-${i}`}
            x={m.x}
            y={H - 8}
            textAnchor="middle"
            className="text-[10px] fill-[#94a3b8]"
          >
            {m.label}
          </text>
        ))}

        {/* Fill area */}
        <path d={fillD} fill="url(#priceGradient)" />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#e21836"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots — small by default, highlighted on hover */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hoveredIndex === i ? 5 : 2.5}
            fill={hoveredIndex === i ? 'white' : '#e21836'}
            stroke="#e21836"
            strokeWidth={hoveredIndex === i ? 2.5 : 0}
            className="transition-all duration-100"
          />
        ))}

        <circle
          cx={bestPoint.x}
          cy={bestPoint.y}
          r="4"
          fill="#ffffff"
          stroke="#10b981"
          strokeWidth="2"
        />
        <circle
          cx={latestPoint.x}
          cy={latestPoint.y}
          r="4"
          fill="#ffffff"
          stroke="#1d4ed8"
          strokeWidth="2"
        />

        {/* Invisible hit areas for hover */}
        {points.map((p, i) => (
          <circle
            key={`hit-${i}`}
            cx={p.x}
            cy={p.y}
            r={12}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(i)}
            className="cursor-pointer"
          />
        ))}

        {/* Tooltip */}
        {hovered && hoveredIndex !== null && (
          <g>
            {/* Vertical guide line */}
            <line
              x1={hovered.x}
              y1={PY}
              x2={hovered.x}
              y2={H - PB}
              stroke="#e21836"
              strokeWidth="1"
              strokeDasharray="3,3"
              opacity="0.4"
            />
            {/* Tooltip box */}
            <rect
              x={Math.min(hovered.x - 45, W - PR - 90)}
              y={Math.max(hovered.y - 42, PY)}
              width="90"
              height="34"
              rx="6"
              fill="#1a1a2e"
              opacity="0.95"
            />
            <text
              x={Math.min(hovered.x, W - PR - 45)}
              y={Math.max(hovered.y - 26, PY + 16)}
              textAnchor="middle"
              className="text-[11px] fill-white font-bold"
            >
              {fmt(hovered.unitPrice)}
            </text>
            <text
              x={Math.min(hovered.x, W - PR - 45)}
              y={Math.max(hovered.y - 13, PY + 29)}
              textAnchor="middle"
              className="text-[9px] fill-[#94a3b8]"
            >
              {formatFull(hovered.date)}
            </text>
          </g>
        )}
      </svg>

      {/* Summary */}
      {isStablePrice ? (
        <div className="mt-3 text-xs text-center text-emerald-600 font-medium">
          Stable price: {fmt(minPrice)} across {prices.length} purchases
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 mt-3 text-xs">
          <SummaryChip label="Best Seen" value={fmt(summary.minPrice)} tone="text-emerald-600" />
          <SummaryChip label="Latest" value={fmt(summary.latestPrice)} tone="text-blue-700" />
          <SummaryChip label="Since First" value={summary.changePercent !== null ? `${summary.changePercent > 0 ? '+' : ''}${summary.changePercent}%` : '—'} tone={summary.changePercent !== null && summary.changePercent > 0 ? 'text-costco-red' : summary.changePercent !== null && summary.changePercent < 0 ? 'text-emerald-600' : 'text-text'} />
          <SummaryChip label="Volatility" value={`${summary.volatilityPercent}%`} tone="text-violet-600" />
        </div>
      )}
    </div>
  )
}

function SummaryChip({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2">
      <div className="text-[11px] text-text-3">{label}</div>
      <div className={`text-sm font-semibold mt-0.5 ${tone}`}>{value}</div>
    </div>
  )
}
