import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, MapPin, Calendar } from 'lucide-react'
import { useGroupedReceipts } from '../../hooks/use-receipts'
import type { YearGroup, MonthGroup, DayGroup } from '../../types/receipt'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function Timeline() {
  const groups = useGroupedReceipts()

  if (groups.length === 0) {
    return (
      <div className="text-center py-16 text-text-3">
        <Calendar className="mx-auto mb-3 opacity-40" size={48} />
        <p className="text-lg font-medium mb-1">No receipts yet</p>
        <p className="text-sm">Import your Costco receipts to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((yg) => (
        <YearSection key={yg.year} group={yg} />
      ))}
    </div>
  )
}

function YearSection({ group }: { group: YearGroup }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-surface rounded-xl border overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <span className="text-lg font-bold">{group.year}</span>
          <span className="text-sm text-text-3">{group.receiptCount} receipts</span>
        </div>
        <div className="text-right">
          <span className="font-semibold">{fmt(group.total)}</span>
          <span className="text-xs text-text-3 ml-2">tax {fmt(group.tax)}</span>
        </div>
      </button>
      {open && (
        <div className="border-t">
          {group.months.map((mg) => (
            <MonthSection key={mg.month} group={mg} />
          ))}
        </div>
      )}
    </div>
  )
}

function MonthSection({ group }: { group: MonthGroup }) {
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 pl-8 hover:bg-surface-3 transition-colors border-b cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="font-semibold">{MONTH_NAMES[group.month]}</span>
          <span className="text-sm text-text-3">{group.receiptCount} receipts</span>
        </div>
        <div className="text-right text-sm">
          <span className="font-medium">{fmt(group.total)}</span>
        </div>
      </button>
      {open && (
        <div>
          {group.days.map((dg) => (
            <DaySection key={dg.date} group={dg} />
          ))}
        </div>
      )}
    </div>
  )
}

function DaySection({ group }: { group: DayGroup }) {
  const navigate = useNavigate()

  const dayLabel = new Date(group.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="border-b last:border-b-0">
      <div className="px-4 py-2 pl-14 flex items-center gap-2 text-xs text-text-3 font-medium">
        <Calendar size={12} />
        {dayLabel}
        <span className="ml-auto">{fmt(group.total)}</span>
      </div>
      {group.receipts.map((r) => (
        <button
          key={r.id}
          onClick={() => navigate(`/receipts/${r.id}`)}
          className="w-full flex items-center justify-between px-4 py-3 pl-16 hover:bg-surface-3 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 text-left">
            <MapPin size={14} className="text-text-3 shrink-0" />
            <div>
              <p className="text-sm font-medium">{r.warehouseName || 'Costco'}</p>
              <p className="text-xs text-text-3">{r.items.length} items</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold">{fmt(r.total)}</p>
            <p className="text-xs text-text-3">tax {fmt(r.tax)}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
