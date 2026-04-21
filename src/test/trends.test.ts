import { describe, it, expect } from 'vitest'
import type { Receipt } from '../types/receipt'

// Replicate the pure logic from use-trends.ts for testing without hooks
function computeMonthlySpend(receipts: Receipt[]) {
  const monthMap = new Map<string, { key: string; year: number; month: number; total: number; count: number }>()
  for (const r of receipts) {
    if ((r.receiptType || '').toLowerCase().includes('gas')) continue
    const d = new Date(r.transactionDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) {
      monthMap.set(key, { key, year: d.getFullYear(), month: d.getMonth(), total: 0, count: 0 })
    }
    const m = monthMap.get(key)!
    m.total += r.total
    m.count += 1
  }
  return Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key))
}

function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: Math.random().toString(36),
    transactionDate: '2025-01-15',
    transactionBarcode: '',
    warehouseName: 'TEST',
    receiptType: '',
    subtotal: 100,
    tax: 10,
    total: 110,
    items: [],
    coupons: [],
    importedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeMonthlySpend', () => {
  it('groups receipts by month', () => {
    const receipts = [
      makeReceipt({ transactionDate: '2025-01-10', total: 100 }),
      makeReceipt({ transactionDate: '2025-01-20', total: 50 }),
      makeReceipt({ transactionDate: '2025-02-05', total: 75 }),
    ]
    const result = computeMonthlySpend(receipts)
    expect(result).toHaveLength(2)
    expect(result[0].key).toBe('2025-01')
    expect(result[0].total).toBe(150)
    expect(result[0].count).toBe(2)
    expect(result[1].key).toBe('2025-02')
    expect(result[1].total).toBe(75)
  })

  it('excludes gas receipts', () => {
    const receipts = [
      makeReceipt({ transactionDate: '2025-01-10', total: 100 }),
      makeReceipt({ transactionDate: '2025-01-15', total: 50, receiptType: 'gas' }),
    ]
    const result = computeMonthlySpend(receipts)
    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(100)
  })

  it('returns empty for no receipts', () => {
    expect(computeMonthlySpend([])).toHaveLength(0)
  })

  it('sorts by month key ascending', () => {
    const receipts = [
      makeReceipt({ transactionDate: '2025-03-15', total: 30 }),
      makeReceipt({ transactionDate: '2024-12-15', total: 10 }),
      makeReceipt({ transactionDate: '2025-01-15', total: 20 }),
    ]
    const result = computeMonthlySpend(receipts)
    expect(result.map((m) => m.key)).toEqual(['2024-12', '2025-01', '2025-03'])
  })
})

// Test price comparison logic
function computePriceChange(pricesA: number[], pricesB: number[]): number | null {
  if (pricesA.length === 0 || pricesB.length === 0) return null
  const avgA = pricesA.reduce((s, v) => s + v, 0) / pricesA.length
  const avgB = pricesB.reduce((s, v) => s + v, 0) / pricesB.length
  if (avgA === 0) return null
  return Math.round(((avgB - avgA) / avgA) * 1000) / 10
}

describe('computePriceChange', () => {
  it('calculates positive change', () => {
    expect(computePriceChange([10], [12])).toBe(20)
  })

  it('calculates negative change', () => {
    expect(computePriceChange([10], [8])).toBe(-20)
  })

  it('returns null for empty arrays', () => {
    expect(computePriceChange([], [10])).toBeNull()
    expect(computePriceChange([10], [])).toBeNull()
  })

  it('returns null for zero average', () => {
    expect(computePriceChange([0], [10])).toBeNull()
  })

  it('averages multiple prices', () => {
    // avg A = 10, avg B = 15 → +50%
    expect(computePriceChange([8, 12], [14, 16])).toBe(50)
  })

  it('returns 0 for no change', () => {
    expect(computePriceChange([10], [10])).toBe(0)
  })
})
