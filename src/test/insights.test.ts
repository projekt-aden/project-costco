import { describe, expect, it } from 'vitest'
import { buildDashboardInsights } from '../lib/insights'
import { buildProductAggregates } from '../lib/analytics'
import type { Receipt } from '../types/receipt'

function id() {
  return Math.random().toString(36).slice(2)
}

function makeReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: id(),
    transactionDate: '2025-01-15',
    transactionBarcode: '111',
    warehouseName: 'Seattle Costco',
    receiptType: '',
    subtotal: 20,
    tax: 2,
    total: 22,
    items: [
      {
        id: id(),
        itemNumber: '100',
        description: 'Organic Eggs',
        unitPrice: 6,
        quantity: 1,
        amount: 6,
      },
      {
        id: id(),
        itemNumber: '200',
        description: 'Milk',
        unitPrice: 5,
        quantity: 1,
        amount: 5,
      },
    ],
    coupons: [],
    importedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('buildDashboardInsights', () => {
  it('creates a compact dashboard narrative from analytics layers', () => {
    const receipts = [
      makeReceipt({ transactionDate: '2025-01-01', total: 45 }),
      makeReceipt({ transactionDate: '2025-02-01', total: 65 }),
      makeReceipt({
        transactionDate: '2025-03-01',
        total: 135,
        items: [
          { id: id(), itemNumber: '100', description: 'Organic Eggs', unitPrice: 6, quantity: 1, amount: 6 },
          { id: id(), itemNumber: '300', description: 'Paper Towels', unitPrice: 24, quantity: 3, amount: 72 },
          { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
        ],
      }),
      makeReceipt({ transactionDate: '2025-04-01', total: 48 }),
    ]

    const products = buildProductAggregates(receipts)
    const insights = buildDashboardInsights(receipts, products)

    expect(insights.length).toBeGreaterThan(1)
    expect(insights[0].id).toBe('spend-overview')
    expect(insights.some((insight) => insight.id === 'core-staple')).toBe(true)
    expect(insights.some((insight) => insight.id === 'trip-pattern')).toBe(true)
  })
})
