import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

interface Props {
  value: string // ISO YYYY-MM-DD
  onChange: (value: string) => void
  max?: string
  min?: string
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(iso: string): string {
  const d = parseDate(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function DatePicker({ value, onChange, min, max }: Props) {
  const [open, setOpen] = useState(false)
  const selected = parseDate(value)
  const [viewYear, setViewYear] = useState(selected.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected.getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // Reset view when opening
  function handleOpen() {
    const d = parseDate(value)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    setOpen(!open)
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1) }
    else setViewMonth(viewMonth - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1) }
    else setViewMonth(viewMonth + 1)
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    onChange(toIso(d))
    setOpen(false)
  }

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const minDate = min ? parseDate(min) : null
  const maxDate = max ? parseDate(max) : null

  function isDisabled(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day)
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }

  function isSelected(day: number): boolean {
    return viewYear === selected.getFullYear() && viewMonth === selected.getMonth() && day === selected.getDate()
  }

  function isToday(day: number): boolean {
    const now = new Date()
    return viewYear === now.getFullYear() && viewMonth === now.getMonth() && day === now.getDate()
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-3 py-2 bg-surface border rounded-xl text-sm outline-none hover:border-costco-red/40 transition-colors cursor-pointer"
      >
        <Calendar size={14} className="text-text-3" />
        <span>{formatDisplay(value)}</span>
      </button>

      {open && (
        <div className="absolute top-full mt-1 z-50 bg-surface border rounded-xl shadow-lg p-3 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3 transition-colors cursor-pointer text-text-2"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-3 transition-colors cursor-pointer text-text-2"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-[10px] text-text-3 text-center py-1 font-medium">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells before first day */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`e-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const disabled = isDisabled(day)
              const sel = isSelected(day)
              const today = isToday(day)

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={`w-8 h-8 mx-auto text-xs rounded-lg flex items-center justify-center transition-colors cursor-pointer
                    ${sel
                      ? 'bg-costco-red text-white font-semibold'
                      : today
                        ? 'bg-red-50 text-costco-red font-semibold hover:bg-costco-red hover:text-white'
                        : disabled
                          ? 'text-text-3/40 cursor-not-allowed'
                          : 'text-text hover:bg-surface-3'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
