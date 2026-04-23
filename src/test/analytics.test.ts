import { describe, expect, it } from 'vitest'
import {
  buildProductAggregates,
  buildProductHabitCollections,
  buildSpendFrequencyPoints,
  computeProductPriceSummary,
  computeSummaryMetrics,
  groupReceipts,
  searchProducts,
  searchReceipts,
} from '../lib/analytics'
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
    ],
    coupons: [],
    importedAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('computeSummaryMetrics', () => {
  it('computes expanded summary values', () => {
    const receipts = [
      makeReceipt(),
      makeReceipt({
        transactionDate: '2025-02-10',
        total: 40,
        subtotal: 36,
        tax: 4,
        items: [
          {
            id: id(),
            itemNumber: '100',
            description: 'Organic Eggs',
            unitPrice: 6,
            quantity: 2,
            amount: 12,
          },
          {
            id: id(),
            itemNumber: '200',
            description: 'Paper Towels',
            unitPrice: 28,
            quantity: 1,
            amount: 28,
          },
        ],
      }),
    ]

    const summary = computeSummaryMetrics(receipts)
    expect(summary.totalSpent).toBe(62)
    expect(summary.receiptCount).toBe(2)
    expect(summary.averagePerTrip).toBe(31)
    expect(summary.uniqueItems).toBe(2)
    expect(summary.totalItems).toBe(3)
    expect(summary.busiestMonth).toBe('Feb 2025')
  })
})

describe('groupReceipts', () => {
  it('groups receipts into descending year sections', () => {
    const groups = groupReceipts([
      makeReceipt({ transactionDate: '2024-12-20' }),
      makeReceipt({ transactionDate: '2025-01-15' }),
    ])

    expect(groups).toHaveLength(2)
    expect(groups[0].year).toBe(2025)
    expect(groups[1].year).toBe(2024)
  })
})

describe('buildProductAggregates', () => {
  it('adds cadence and staple metadata', () => {
    const productReceipts = [
      makeReceipt({ transactionDate: '2025-01-01' }),
      makeReceipt({ transactionDate: '2025-01-31' }),
      makeReceipt({ transactionDate: '2025-03-02' }),
    ]

    const [product] = buildProductAggregates(productReceipts)
    expect(product.itemNumber).toBe('100')
    expect(product.purchaseMonthsCount).toBe(2)
    expect(product.averageDaysBetweenPurchases).toBe(30)
    expect(product.stapleScore).toBeGreaterThan(0)
  })
})

describe('computeProductPriceSummary', () => {
  it('computes latest, average, change, and volatility stats', () => {
    const summary = computeProductPriceSummary([
      { date: '2025-01-01', unitPrice: 10 },
      { date: '2025-02-01', unitPrice: 12 },
      { date: '2025-03-01', unitPrice: 8 },
    ])

    expect(summary).not.toBeNull()
    expect(summary?.firstPrice).toBe(10)
    expect(summary?.latestPrice).toBe(8)
    expect(summary?.minPrice).toBe(8)
    expect(summary?.maxPrice).toBe(12)
    expect(summary?.averagePrice).toBe(10)
    expect(summary?.changePercent).toBe(-20)
    expect(summary?.volatilityPercent).toBe(40)
  })
})

describe('buildProductHabitCollections', () => {
  it('classifies core staples, emerging repeats, and cooling off products', () => {
    const products = buildProductAggregates([
      makeReceipt({ transactionDate: '2025-01-01', items: [{ id: id(), itemNumber: '100', description: 'Organic Eggs', unitPrice: 6, quantity: 1, amount: 6 }] }),
      makeReceipt({ transactionDate: '2025-02-01', items: [{ id: id(), itemNumber: '100', description: 'Organic Eggs', unitPrice: 6, quantity: 1, amount: 6 }] }),
      makeReceipt({ transactionDate: '2025-03-01', items: [{ id: id(), itemNumber: '100', description: 'Organic Eggs', unitPrice: 6, quantity: 2, amount: 12 }] }),
      makeReceipt({ transactionDate: '2025-01-10', items: [{ id: id(), itemNumber: '200', description: 'Protein Bars', unitPrice: 15, quantity: 1, amount: 15 }] }),
      makeReceipt({ transactionDate: '2025-02-05', items: [{ id: id(), itemNumber: '200', description: 'Protein Bars', unitPrice: 15, quantity: 1, amount: 15 }] }),
      makeReceipt({ transactionDate: '2025-03-20', items: [{ id: id(), itemNumber: '300', description: 'Dish Soap', unitPrice: 12, quantity: 1, amount: 12 }] }),
      makeReceipt({ transactionDate: '2025-04-15', items: [{ id: id(), itemNumber: '300', description: 'Dish Soap', unitPrice: 12, quantity: 1, amount: 12 }] }),
      makeReceipt({ transactionDate: '2025-01-05', items: [{ id: id(), itemNumber: '400', description: 'Almond Butter', unitPrice: 11, quantity: 1, amount: 11 }] }),
      makeReceipt({ transactionDate: '2025-02-10', items: [{ id: id(), itemNumber: '400', description: 'Almond Butter', unitPrice: 11, quantity: 1, amount: 11 }] }),
      makeReceipt({ transactionDate: '2025-05-20', items: [{ id: id(), itemNumber: '500', description: 'Greek Yogurt', unitPrice: 9, quantity: 1, amount: 9 }] }),
    ])

    const habits = buildProductHabitCollections(products)
    expect(habits.coreStaples.some((insight) => insight.product.itemNumber === '100')).toBe(true)
    expect(habits.emergingStaples.some((insight) => insight.product.itemNumber === '300')).toBe(true)
    expect(habits.coolingOff.some((insight) => insight.product.itemNumber === '400')).toBe(true)
  })
})

describe('search utilities', () => {
  it('finds receipts by warehouse and item name', () => {
    const receipts = [
      makeReceipt({ warehouseName: 'Seattle Costco', transactionBarcode: 'ABC123' }),
    ]

    expect(searchReceipts(receipts, 'seattle')).toHaveLength(1)
    expect(searchReceipts(receipts, 'eggs')).toHaveLength(1)
  })

  it('finds products by name and warehouse', () => {
    const products = buildProductAggregates([
      makeReceipt({ warehouseName: 'Seattle Costco' }),
      makeReceipt({
        transactionDate: '2025-02-10',
        warehouseName: 'Tacoma Costco',
        items: [
          {
            id: id(),
            itemNumber: '200',
            description: 'Paper Towels',
            unitPrice: 20,
            quantity: 1,
            amount: 20,
          },
        ],
      }),
    ])

    expect(searchProducts(products, 'paper')).toHaveLength(1)
    expect(searchProducts(products, 'tacoma')).toHaveLength(1)
  })
})

describe('buildSpendFrequencyPoints', () => {
  it('normalizes products for scatter plotting', () => {
    const products = buildProductAggregates([
      makeReceipt({ transactionDate: '2025-01-01' }),
      makeReceipt({ transactionDate: '2025-02-01' }),
      makeReceipt({
        transactionDate: '2025-02-10',
        items: [{ id: id(), itemNumber: '200', description: 'Paper Towels', unitPrice: 20, quantity: 1, amount: 20 }],
      }),
    ])

    const points = buildSpendFrequencyPoints(products)
    expect(points.length).toBe(2)
    expect(points.every((point) => point.xRatio >= 0 && point.xRatio <= 1)).toBe(true)
    expect(points.every((point) => point.yRatio >= 0 && point.yRatio <= 1)).toBe(true)
    expect(points.every((point) => point.radius >= 5)).toBe(true)
  })
})
