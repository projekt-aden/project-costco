import { useState } from 'react'
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

  const values = prices.map((p) => p.unitPrice)
  const minPrice = Math.min(...values)
  const maxPrice = Math.max(...values)
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
        <div className="flex justify-between mt-3 text-xs">
          <span className="text-emerald-600 font-medium">Low: {fmt(minPrice)}</span>
          <span className="text-text-2">
            Avg: {fmt(values.reduce((s, v) => s + v, 0) / values.length)}
          </span>
          <span className="text-costco-red font-medium">High: {fmt(maxPrice)}</span>
        </div>
      )}
    </div>
  )
}
