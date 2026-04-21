import { useState } from 'react'
import type { MonthlySpend } from '../../hooks/use-trends'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const YEAR_COLORS = ['#e21836', '#005daa', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

export function MonthlyChart({ data, years }: { data: MonthlySpend[]; years: number[] }) {
  const [hovered, setHovered] = useState<{ year: number; month: number } | null>(null)

  if (data.length === 0) return null

  // Group by year → month
  const byYear = new Map<number, Map<number, number>>()
  for (const m of data) {
    if (!byYear.has(m.year)) byYear.set(m.year, new Map())
    byYear.get(m.year)!.set(m.month, m.total)
  }

  const maxVal = Math.max(...data.map((m) => m.total))

  const W = 600
  const H = 260
  const PX = 56
  const PR = 16
  const PY = 16
  const PB = 40
  const chartW = W - PX - PR
  const chartH = H - PY - PB
  const barGroupW = chartW / 12
  const barW = Math.min(barGroupW / (years.length + 0.5), 20)
  const gap = 2

  // Y grid
  const ySteps = 4
  const yMax = Math.ceil(maxVal / 100) * 100 || 100
  const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => (yMax / ySteps) * i)

  const hoveredData = hovered
    ? data.find((d) => d.year === hovered.year && d.month === hovered.month)
    : null

  return (
    <div className="bg-surface rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">Monthly Spending</h4>
        <div className="flex items-center gap-3">
          {years.map((y, i) => (
            <div key={y} className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded-sm" style={{ background: YEAR_COLORS[i % YEAR_COLORS.length] }} />
              <span className="text-text-2">{y}</span>
            </div>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHovered(null)}>
        {/* Y grid */}
        {yLabels.map((val, i) => {
          const y = PY + chartH - (val / yMax) * chartH
          return (
            <g key={i}>
              <line x1={PX} y1={y} x2={W - PR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PX - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-[#94a3b8]">
                {fmt(val)}
              </text>
            </g>
          )
        })}

        {/* Month labels */}
        {MONTH_SHORT.map((label, mi) => (
          <text
            key={mi}
            x={PX + barGroupW * mi + barGroupW / 2}
            y={H - 12}
            textAnchor="middle"
            className="text-[10px] fill-[#94a3b8]"
          >
            {label}
          </text>
        ))}

        {/* Bars */}
        {years.map((year, yi) =>
          Array.from({ length: 12 }, (_, mi) => {
            const val = byYear.get(year)?.get(mi) || 0
            if (val === 0) return null
            const barH = (val / yMax) * chartH
            const x = PX + barGroupW * mi + (barGroupW - barW * years.length - gap * (years.length - 1)) / 2 + yi * (barW + gap)
            const y = PY + chartH - barH
            const isHovered = hovered?.year === year && hovered?.month === mi
            return (
              <rect
                key={`${year}-${mi}`}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                fill={YEAR_COLORS[yi % YEAR_COLORS.length]}
                opacity={hovered ? (isHovered ? 1 : 0.3) : 0.85}
                className="transition-opacity duration-100 cursor-pointer"
                onMouseEnter={() => setHovered({ year, month: mi })}
              />
            )
          }),
        )}

        {/* Tooltip */}
        {hoveredData && hovered && (
          <g>
            <rect
              x={Math.min(PX + barGroupW * hovered.month + barGroupW / 2 - 50, W - PR - 100)}
              y={PY}
              width="100"
              height="38"
              rx="6"
              fill="#1a1a2e"
              opacity="0.95"
            />
            <text
              x={Math.min(PX + barGroupW * hovered.month + barGroupW / 2, W - PR - 50)}
              y={PY + 16}
              textAnchor="middle"
              className="text-[11px] fill-white font-bold"
            >
              {fmt(hoveredData.total)}
            </text>
            <text
              x={Math.min(PX + barGroupW * hovered.month + barGroupW / 2, W - PR - 50)}
              y={PY + 30}
              textAnchor="middle"
              className="text-[9px] fill-[#94a3b8]"
            >
              {MONTH_SHORT[hovered.month]} {hovered.year} · {hoveredData.receiptCount} trips
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
