import { describe, it, expect } from 'vitest'
import type { Receipt } from '../types/receipt'
import {
  computeMonthComparisons,
  computeMonthlySpend,
  computePriceMovers,
  computeShoppingDayIntensity,
} from '../lib/trends'

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
    expect(result[0].receiptCount).toBe(2)
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

describe('computePriceMovers', () => {
  it('calculates product-level price changes across years', () => {
    const receipts = [
      makeReceipt({
        transactionDate: '2024-01-10',
        items: [{ id: 'a', itemNumber: '100', description: 'Eggs', unitPrice: 10, quantity: 1, amount: 10 }],
      }),
      makeReceipt({
        transactionDate: '2025-01-10',
        items: [{ id: 'b', itemNumber: '100', description: 'Eggs', unitPrice: 12, quantity: 1, amount: 12 }],
      }),
    ]

    const movers = computePriceMovers(receipts, 2024, 2025)
    expect(movers).toHaveLength(1)
    expect(movers[0].changePercent).toBe(20)
    expect(movers[0].oldPrice).toBe(10)
    expect(movers[0].newPrice).toBe(12)
  })
})

describe('computeShoppingDayIntensity', () => {
  it('groups receipts into shopping days with week positions', () => {
    const days = computeShoppingDayIntensity([
      makeReceipt({ transactionDate: '2024-01-05', total: 30 }),
      makeReceipt({ transactionDate: '2024-01-05', total: 20 }),
      makeReceipt({ transactionDate: '2025-02-10', total: 50 }),
    ], 2024, 2025)

    expect(days).toHaveLength(2)
    expect(days[0].total).toBe(50)
    expect(days[0].receiptCount).toBe(2)
    expect(days[0].weekIndex).toBeGreaterThanOrEqual(0)
  })
})

describe('computeMonthComparisons', () => {
  it('creates month-by-month comparison rows', () => {
    const monthlySpend = computeMonthlySpend([
      makeReceipt({ transactionDate: '2024-01-10', total: 100 }),
      makeReceipt({ transactionDate: '2025-01-10', total: 125 }),
      makeReceipt({ transactionDate: '2025-02-10', total: 60 }),
    ])

    const comparisons = computeMonthComparisons(monthlySpend, 2024, 2025)
    expect(comparisons).toHaveLength(12)
    expect(comparisons[0].label).toBe('Jan')
    expect(comparisons[0].spendA).toBe(100)
    expect(comparisons[0].spendB).toBe(125)
    expect(comparisons[0].changePercent).toBe(25)
    expect(comparisons[1].spendA).toBe(0)
    expect(comparisons[1].spendB).toBe(60)
    expect(comparisons[1].changePercent).toBeNull()
  })
})
