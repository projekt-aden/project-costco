import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { buildSpendFrequencyPoints } from '../../lib/analytics'
import type { ProductAggregate } from '../../types/product'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function SpendFrequencyChart({ products }: { products: ProductAggregate[] }) {
  const navigate = useNavigate()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const points = useMemo(() => buildSpendFrequencyPoints(products), [products])

  if (points.length < 3) return null

  const W = 720
  const H = 320
  const PX = 56
  const PY = 20
  const PR = 20
  const PB = 48
  const chartW = W - PX - PR
  const chartH = H - PY - PB

  const plotted = points.map((point) => ({
    ...point,
    cx: PX + point.xRatio * chartW,
    cy: PY + chartH - point.yRatio * chartH,
  }))

  const hovered = hoveredItem ? plotted.find((point) => point.itemNumber === hoveredItem) || null : null

  return (
    <div className="bg-surface rounded-xl border p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h4 className="font-semibold">Spend vs Frequency</h4>
          <p className="text-sm text-text-3 mt-1">
            Products in the upper-right are true heavy hitters. Point size grows with active months.
          </p>
        </div>
        <div className="text-xs text-text-3 shrink-0">
          {points.length} products
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setHoveredItem(null)}
      >
        <line x1={PX} y1={PY} x2={PX} y2={PY + chartH} stroke="#cbd5e1" strokeWidth="1.5" />
        <line x1={PX} y1={PY + chartH} x2={W - PR} y2={PY + chartH} stroke="#cbd5e1" strokeWidth="1.5" />

        <line x1={PX + chartW / 2} y1={PY} x2={PX + chartW / 2} y2={PY + chartH} stroke="#e2e8f0" strokeDasharray="4,4" />
        <line x1={PX} y1={PY + chartH / 2} x2={W - PR} y2={PY + chartH / 2} stroke="#e2e8f0" strokeDasharray="4,4" />

        <text x={PX} y={H - 12} className="text-[11px] fill-[#94a3b8]">Lower frequency</text>
        <text x={W - PR} y={H - 12} textAnchor="end" className="text-[11px] fill-[#94a3b8]">Higher frequency</text>
        <text x={20} y={PY + 10} className="text-[11px] fill-[#94a3b8]">Higher spend</text>
        <text x={20} y={PY + chartH} className="text-[11px] fill-[#94a3b8]">Lower spend</text>

        <text x={PX + 12} y={PY + 18} className="text-[10px] fill-[#94a3b8]">Occasional splurge</text>
        <text x={W - PR - 12} y={PY + 18} textAnchor="end" className="text-[10px] fill-[#94a3b8]">Heavy hitters</text>
        <text x={PX + 12} y={PY + chartH - 10} className="text-[10px] fill-[#94a3b8]">Low-signal</text>
        <text x={W - PR - 12} y={PY + chartH - 10} textAnchor="end" className="text-[10px] fill-[#94a3b8]">Everyday repeats</text>

        {plotted.map((point) => {
          const isHovered = point.itemNumber === hoveredItem
          const hue = Math.max(0, Math.min(1, point.stapleScore / 20))
          const fill = `rgba(${Math.round(226 - hue * 90)}, ${Math.round(24 + hue * 90)}, ${Math.round(54 + hue * 110)}, ${isHovered ? 0.95 : 0.75})`
          return (
            <g key={point.itemNumber}>
              <circle
                cx={point.cx}
                cy={point.cy}
                r={isHovered ? point.radius + 1.5 : point.radius}
                fill={fill}
                stroke={isHovered ? '#111827' : '#ffffff'}
                strokeWidth={isHovered ? 2 : 1.5}
                className="cursor-pointer transition-all duration-100"
                onMouseEnter={() => setHoveredItem(point.itemNumber)}
                onClick={() => navigate(`/analysis/${point.itemNumber}`)}
              />
            </g>
          )
        })}

        {hovered && (
          <g>
            <rect
              x={Math.min(Math.max(hovered.cx - 82, PX), W - PR - 164)}
              y={Math.max(hovered.cy - 72, PY)}
              width="164"
              height="58"
              rx="8"
              fill="#111827"
              opacity="0.96"
            />
            <text
              x={Math.min(Math.max(hovered.cx, PX + 82), W - PR - 82)}
              y={Math.max(hovered.cy - 54, PY + 18)}
              textAnchor="middle"
              className="text-[11px] fill-white font-bold"
            >
              {truncate(hovered.description, 22)}
            </text>
            <text
              x={Math.min(Math.max(hovered.cx, PX + 82), W - PR - 82)}
              y={Math.max(hovered.cy - 38, PY + 34)}
              textAnchor="middle"
              className="text-[10px] fill-[#cbd5e1]"
            >
              {hovered.purchaseCount}x bought · {fmt(hovered.totalSpent)}
            </text>
            <text
              x={Math.min(Math.max(hovered.cx, PX + 82), W - PR - 82)}
              y={Math.max(hovered.cy - 23, PY + 49)}
              textAnchor="middle"
              className="text-[10px] fill-[#94a3b8]"
            >
              {hovered.purchaseMonthsCount} active months
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`
}
