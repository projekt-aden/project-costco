import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  value: number
  years: number[]
  onChange: (year: number) => void
}

export function YearSelect({ value, years, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-surface border rounded-xl text-sm font-medium hover:border-costco-red/40 transition-colors cursor-pointer min-w-[5rem] justify-between"
      >
        {value}
        <ChevronDown size={14} className={`text-text-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-1 z-50 bg-surface border rounded-xl shadow-lg p-1 min-w-[5rem]">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => { onChange(y); setOpen(false) }}
              className={`w-full px-3 py-1.5 text-sm text-left rounded-lg transition-colors cursor-pointer ${
                y === value
                  ? 'bg-costco-red text-white font-semibold'
                  : 'hover:bg-surface-3'
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
