import { describe, expect, it } from 'vitest'
import { computeTripBehavior, profileTrip } from '../lib/trips'
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
    subtotal: 50,
    tax: 5,
    total: 55,
    items: [
      {
        id: id(),
        itemNumber: '100',
        description: 'Eggs',
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

describe('profileTrip', () => {
  it('classifies gas stops', () => {
    const trip = profileTrip(makeReceipt({
      receiptType: 'fuel',
      total: 48,
      items: [{
        id: id(),
        itemNumber: 'gas',
        description: 'Regular',
        unitPrice: 3.6,
        quantity: 13,
        amount: 48,
        fuelGallons: 13,
        fuelPricePerGallon: 3.6,
      }],
    }))

    expect(trip.archetype).toBe('gas-stop')
  })

  it('classifies quick refills', () => {
    const trip = profileTrip(makeReceipt({
      total: 42,
      items: [
        { id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 },
        { id: id(), itemNumber: '200', description: 'Milk', unitPrice: 5, quantity: 1, amount: 5 },
        { id: id(), itemNumber: '300', description: 'Bread', unitPrice: 4, quantity: 1, amount: 4 },
      ],
    }))

    expect(trip.archetype).toBe('quick-refill')
  })

  it('classifies big hauls', () => {
    const trip = profileTrip(makeReceipt({
      total: 280,
      items: Array.from({ length: 13 }, (_, index) => ({
        id: id(),
        itemNumber: `${index}`,
        description: `Item ${index}`,
        unitPrice: 10,
        quantity: 1,
        amount: 10,
      })),
    }))

    expect(trip.archetype).toBe('big-haul')
  })

  it('classifies stock-ups', () => {
    const trip = profileTrip(makeReceipt({
      total: 135,
      items: [
        { id: id(), itemNumber: '100', description: 'Water', unitPrice: 18, quantity: 3, amount: 54 },
        { id: id(), itemNumber: '200', description: 'Paper Towels', unitPrice: 27, quantity: 2, amount: 54 },
      ],
    }))

    expect(trip.archetype).toBe('stock-up')
  })
})

describe('computeTripBehavior', () => {
  it('builds summary metrics and highlights', () => {
    const summary = computeTripBehavior([
      makeReceipt({ transactionDate: '2025-05-05', total: 48, items: [{ id: id(), itemNumber: 'g', description: 'Regular', unitPrice: 3.7, quantity: 13, amount: 48, fuelGallons: 13, fuelPricePerGallon: 3.7 }], receiptType: 'fuel' }),
      makeReceipt({ transactionDate: '2025-05-04', total: 38, items: [{ id: id(), itemNumber: '100', description: 'Eggs', unitPrice: 6, quantity: 1, amount: 6 }] }),
      makeReceipt({ transactionDate: '2025-05-03', total: 260, items: Array.from({ length: 14 }, (_, index) => ({ id: id(), itemNumber: `${index}`, description: `Item ${index}`, unitPrice: 10, quantity: 1, amount: 10 })) }),
      makeReceipt({ transactionDate: '2025-05-02', total: 145, items: [{ id: id(), itemNumber: '200', description: 'Water', unitPrice: 20, quantity: 3, amount: 60 }, { id: id(), itemNumber: '201', description: 'Towels', unitPrice: 25, quantity: 2, amount: 50 }] }),
    ])

    expect(summary.counts['gas-stop']).toBe(1)
    expect(summary.counts['big-haul']).toBe(1)
    expect(summary.counts['stock-up']).toBe(1)
    expect(summary.biggestHaul?.archetype).toBe('big-haul')
    expect(summary.latestStockUp?.archetype).toBe('stock-up')
    expect(summary.averageBasketSpend).toBeGreaterThan(0)
  })
})
