import { useMemo, useSyncExternalStore } from 'react'
import { useReceipts } from './use-receipts'
import type { Receipt } from '../types/receipt'

const STORAGE_KEY = 'costco-year-filter'

// Simple external store for cross-component sync
const listeners = new Set<() => void>()

function getSnapshot(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setYearFilter(year: number | null) {
  if (typeof localStorage === 'undefined') return
  if (year === null) {
    localStorage.removeItem(STORAGE_KEY)
  } else {
    localStorage.setItem(STORAGE_KEY, String(year))
  }
  listeners.forEach((cb) => cb())
}

export function useYearFilter() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null)
  const selectedYear = raw ? parseInt(raw) : null
  return { selectedYear, setYear: setYearFilter }
}

export function useAvailableYears(): number[] {
  const receipts = useReceipts()
  return useMemo(() => {
    const years = new Set<number>()
    for (const r of receipts) {
      years.add(new Date(r.transactionDate).getFullYear())
    }
    return Array.from(years).sort((a, b) => b - a)
  }, [receipts])
}

export function useFilteredReceipts(): Receipt[] {
  const receipts = useReceipts()
  const { selectedYear } = useYearFilter()

  return useMemo(() => {
    if (selectedYear === null) return receipts
    return receipts.filter((r) => new Date(r.transactionDate).getFullYear() === selectedYear)
  }, [receipts, selectedYear])
}
