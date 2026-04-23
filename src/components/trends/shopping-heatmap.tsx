import type { ShoppingDayIntensity } from '../../lib/trends'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function colorForIntensity(ratio: number, yearIndex: number) {
  const palette = yearIndex === 0
    ? ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb']
    : ['#fff1f2', '#fecdd3', '#fb7185', '#e11d48']

  if (ratio <= 0) return '#f8fafc'
  if (ratio < 0.34) return palette[0]
  if (ratio < 0.6) return palette[1]
  if (ratio < 0.82) return palette[2]
  return palette[3]
}

export function ShoppingHeatmap({
  days,
  years,
}: {
  days: ShoppingDayIntensity[]
  years: [number, number]
}) {
  if (days.length === 0) return null

  const grouped = new Map<number, ShoppingDayIntensity[]>()
  for (const day of days) {
    if (!grouped.has(day.year)) grouped.set(day.year, [])
    grouped.get(day.year)!.push(day)
  }

  return (
    <div className="bg-surface rounded-xl border p-4 space-y-4">
      <div>
        <h4 className="font-semibold">Shopping Rhythm</h4>
        <p className="text-sm text-text-3 mt-1">
          A calendar-style view of when shopping actually happened and how heavy each day was.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {years.map((year, index) => (
          <HeatmapYear
            key={year}
            year={year}
            yearIndex={index}
            days={grouped.get(year) || []}
          />
        ))}
      </div>
    </div>
  )
}

function HeatmapYear({
  year,
  yearIndex,
  days,
}: {
  year: number
  yearIndex: number
  days: ShoppingDayIntensity[]
}) {
  const maxTotal = Math.max(...days.map((day) => day.total), 0)
  const monthAnchors = new Map<number, number>()
  for (const day of days) {
    if (!monthAnchors.has(day.month)) {
      monthAnchors.set(day.month, day.weekIndex)
    }
  }

  const columns = Math.max(...days.map((day) => day.weekIndex), 0) + 1

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="font-medium">{year}</h5>
        <div className="text-xs text-text-3">
          {days.length} active shopping days
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          <div
            className="grid gap-1 text-[10px] text-text-3 mb-2"
            style={{ gridTemplateColumns: `32px repeat(${columns}, minmax(0, 1fr))` }}
          >
            <div />
            {Array.from({ length: columns }, (_, weekIndex) => (
              <div key={weekIndex} className="text-center">
                {Array.from(monthAnchors.entries()).find(([, anchor]) => anchor === weekIndex)?.[0] !== undefined
                  ? MONTH_SHORT[Array.from(monthAnchors.entries()).find(([, anchor]) => anchor === weekIndex)![0]]
                  : ''}
              </div>
            ))}
          </div>

          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `32px repeat(${columns}, minmax(0, 1fr))` }}
          >
            {WEEKDAY_LABELS.map((weekdayLabel, weekday) => (
              <Row
                key={`${year}-${weekday}`}
                label={weekdayLabel}
                weekday={weekday}
                columns={columns}
                days={days}
                maxTotal={maxTotal}
                yearIndex={yearIndex}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({
  label,
  weekday,
  columns,
  days,
  maxTotal,
  yearIndex,
}: {
  label: string
  weekday: number
  columns: number
  days: ShoppingDayIntensity[]
  maxTotal: number
  yearIndex: number
}) {
  const dayMap = new Map(days.filter((day) => day.weekday === weekday).map((day) => [day.weekIndex, day]))

  return (
    <>
      <div className="text-[10px] text-text-3 flex items-center">{label}</div>
      {Array.from({ length: columns }, (_, weekIndex) => {
        const day = dayMap.get(weekIndex)
        if (!day) {
          return <div key={`${label}-${weekIndex}`} className="aspect-square rounded-[4px] bg-surface-2" />
        }

        const ratio = maxTotal > 0 ? day.total / maxTotal : 0
        return (
          <div
            key={day.date}
            className="aspect-square rounded-[4px] border border-white/50"
            style={{ backgroundColor: colorForIntensity(ratio, yearIndex) }}
            title={`${day.date} · ${fmt(day.total)} · ${day.receiptCount} trip${day.receiptCount === 1 ? '' : 's'}`}
          />
        )
      })}
    </>
  )
}
