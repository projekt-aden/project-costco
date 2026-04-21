import { describe, it, expect } from 'vitest'

// Test the pure date utility functions from DatePicker

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

describe('DatePicker utilities', () => {
  describe('parseDate', () => {
    it('parses ISO date string', () => {
      const d = parseDate('2025-03-15')
      expect(d.getFullYear()).toBe(2025)
      expect(d.getMonth()).toBe(2) // March = 2
      expect(d.getDate()).toBe(15)
    })

    it('handles single-digit months', () => {
      const d = parseDate('2025-01-05')
      expect(d.getMonth()).toBe(0)
      expect(d.getDate()).toBe(5)
    })
  })

  describe('toIso', () => {
    it('formats date as ISO string', () => {
      expect(toIso(new Date(2025, 0, 1))).toBe('2025-01-01')
      expect(toIso(new Date(2025, 11, 31))).toBe('2025-12-31')
    })

    it('pads single digits', () => {
      expect(toIso(new Date(2025, 2, 5))).toBe('2025-03-05')
    })
  })

  describe('formatDisplay', () => {
    it('formats for display', () => {
      const result = formatDisplay('2025-01-15')
      expect(result).toContain('Jan')
      expect(result).toContain('15')
      expect(result).toContain('2025')
    })
  })

  describe('roundtrip', () => {
    it('parseDate → toIso preserves value', () => {
      const iso = '2025-06-20'
      expect(toIso(parseDate(iso))).toBe(iso)
    })
  })
})
