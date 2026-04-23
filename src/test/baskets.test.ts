import { describe, expect, it } from 'vitest'
import { computeBasketIntelligence, computeProductCompanions } from '../lib/baskets'
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
    subtotal: 30,
    tax: 3,
    total: 33,
    items: [
      { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
      { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
    ],
    coupons: [],
    importedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeBasketIntelligence', () => {
  it('finds recurring product pairs and focused trips', () => {
    const summary = computeBasketIntelligence([
      makeReceipt({
        items: [
          { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
          { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
          { id: id(), itemNumber: '300', description: 'Bread', unitPrice: 4, quantity: 1, amount: 4 },
        ],
      }),
      makeReceipt({
        transactionDate: '2025-01-20',
        items: [
          { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
          { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
        ],
      }),
      makeReceipt({
        transactionDate: '2025-02-01',
        total: 40,
        items: [
          { id: id(), itemNumber: '400', description: 'Paper Towels', unitPrice: 24, quantity: 1, amount: 24 },
          { id: id(), itemNumber: '500', description: 'Bananas', unitPrice: 3, quantity: 1, amount: 3 },
          { id: id(), itemNumber: '600', description: 'Muffins', unitPrice: 5, quantity: 1, amount: 5 },
        ],
      }),
    ])

    expect(summary.topPairs[0].itemNumberA).toBe('100')
    expect(summary.topPairs[0].itemNumberB).toBe('200')
    expect(summary.topPairs[0].pairCount).toBe(2)
    expect(summary.singlePurposeTrips.some((trip) => trip.focusItemNumber === '400')).toBe(true)
  })
})

describe('computeProductCompanions', () => {
  it('returns strongest companions for a product', () => {
    const companions = computeProductCompanions([
      makeReceipt({
        items: [
          { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
          { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
          { id: id(), itemNumber: '300', description: 'Bread', unitPrice: 4, quantity: 1, amount: 4 },
        ],
      }),
      makeReceipt({
        transactionDate: '2025-02-10',
        items: [
          { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
          { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
        ],
      }),
      makeReceipt({
        transactionDate: '2025-03-01',
        items: [
          { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
          { id: id(), itemNumber: '400', description: 'Coffee', unitPrice: 14, quantity: 1, amount: 14 },
        ],
      }),
    ], '100')

    expect(companions[0].itemNumber).toBe('200')
    expect(companions[0].pairCount).toBe(2)
    expect(companions[0].togetherRate).toBeCloseTo(66.7, 1)
  })
})
