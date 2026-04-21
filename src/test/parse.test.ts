import { describe, it, expect } from 'vitest'
import { parseReceipt, parseReceiptsFromJson } from '../db/parse'
import type { CostcoReceiptRaw } from '../types/receipt'

const sampleRaw: CostcoReceiptRaw = {
  transactionDate: '01/15/2025',
  transactionBarcode: '123456789',
  warehouseName: 'ISSAQUAH',
  total: '125.43',
  itemArray: [
    {
      itemNumber: '1234567',
      itemDescription01: 'KS ORGANIC MILK',
      amount: '9.99',
      itemUnitPriceAmount: '9.99',
      quantity: 1,
    },
    {
      itemNumber: '7654321',
      itemDescription01: 'ROTISSERIE CHICKEN',
      amount: '4.99',
      quantity: 1,
    },
  ],
  subTaxes: { tax1: '10.45' },
  couponArray: [
    { itemNumber: '1234567', itemDescription01: 'MFR COUPON', amount: '-2.00' },
  ],
}

describe('parseReceipt', () => {
  it('parses date from MM/DD/YYYY to ISO', () => {
    const receipt = parseReceipt(sampleRaw)
    expect(receipt.transactionDate).toBe('2025-01-15')
  })

  it('parses total, tax, subtotal', () => {
    const receipt = parseReceipt(sampleRaw)
    expect(receipt.total).toBe(125.43)
    expect(receipt.tax).toBe(10.45)
    expect(receipt.subtotal).toBe(114.98)
  })

  it('parses items with correct fields', () => {
    const receipt = parseReceipt(sampleRaw)
    expect(receipt.items).toHaveLength(2)
    expect(receipt.items[0].itemNumber).toBe('1234567')
    expect(receipt.items[0].description).toBe('KS ORGANIC MILK')
    expect(receipt.items[0].unitPrice).toBe(9.99)
    expect(receipt.items[0].amount).toBe(9.99)
    expect(receipt.items[0].quantity).toBe(1)
  })

  it('parses coupons', () => {
    const receipt = parseReceipt(sampleRaw)
    expect(receipt.coupons).toHaveLength(1)
    expect(receipt.coupons[0].amount).toBe(-2)
  })

  it('generates unique ids', () => {
    const r1 = parseReceipt(sampleRaw)
    const r2 = parseReceipt(sampleRaw)
    expect(r1.id).not.toBe(r2.id)
  })

  it('preserves barcode and warehouse', () => {
    const receipt = parseReceipt(sampleRaw)
    expect(receipt.transactionBarcode).toBe('123456789')
    expect(receipt.warehouseName).toBe('ISSAQUAH')
  })

  it('handles missing optional fields', () => {
    const minimal: CostcoReceiptRaw = {
      transactionDate: '12/25/2024',
      transactionBarcode: '',
      warehouseName: '',
      total: '50.00',
      itemArray: [],
    }
    const receipt = parseReceipt(minimal)
    expect(receipt.total).toBe(50)
    expect(receipt.tax).toBe(0)
    expect(receipt.subtotal).toBe(50)
    expect(receipt.items).toHaveLength(0)
    expect(receipt.coupons).toHaveLength(0)
  })

  it('handles numeric amounts (not strings)', () => {
    const raw: CostcoReceiptRaw = {
      transactionDate: '03/01/2025',
      transactionBarcode: '999',
      warehouseName: 'TEST',
      total: 42.5 as unknown as string,
      itemArray: [
        { itemNumber: '111', itemDescription01: 'ITEM', amount: 42.5 as unknown as string },
      ],
    }
    const receipt = parseReceipt(raw)
    expect(receipt.total).toBe(42.5)
    expect(receipt.items[0].amount).toBe(42.5)
  })
})

describe('parseReceiptsFromJson', () => {
  it('parses a single object', () => {
    const result = parseReceiptsFromJson(sampleRaw)
    expect(result).toHaveLength(1)
    expect(result[0].transactionBarcode).toBe('123456789')
  })

  it('parses an array', () => {
    const result = parseReceiptsFromJson([sampleRaw, sampleRaw])
    expect(result).toHaveLength(2)
  })

  it('throws on invalid input', () => {
    expect(() => parseReceiptsFromJson('string')).toThrow('Invalid receipt format')
    expect(() => parseReceiptsFromJson(42)).toThrow('Invalid receipt format')
    expect(() => parseReceiptsFromJson(null)).toThrow('Invalid receipt format')
  })
})

describe('parseReceipt — raw Costco API format', () => {
  const rawApi = {
    warehouseName: 'DEDHAM',
    receiptType: 'In-Warehouse',
    documentType: 'WarehouseReceiptDetail',
    transactionDateTime: '2024-10-12T17:31:00',
    transactionDate: '2024-10-12',
    transactionBarcode: '21031920102022410121731',
    total: 226.03,
    subTotal: 223.78,
    taxes: 2.25,
    totalItemCount: 23,
    warehouseCity: 'DEDHAM',
    warehouseState: 'MA',
    itemArray: [
      {
        itemNumber: '18600',
        itemDescription01: 'MANDARINS',
        itemDescription02: '2.27 KG / 5 LBS',
        unit: 1,
        amount: 6.49,
        taxFlag: 'N',
        itemUnitPriceAmount: 6.49,
        fuelUnitQuantity: null,
        fuelGradeCode: null,
      },
    ],
    subTaxes: null,
  }

  it('parses ISO date', () => {
    const r = parseReceipt(rawApi)
    expect(r.transactionDate).toBe('2024-10-12')
  })

  it('uses direct taxes and subTotal fields', () => {
    const r = parseReceipt(rawApi)
    expect(r.tax).toBe(2.25)
    expect(r.subtotal).toBe(223.78)
    expect(r.total).toBe(226.03)
  })

  it('includes city/state in warehouse name', () => {
    const r = parseReceipt(rawApi)
    expect(r.warehouseName).toContain('DEDHAM')
    expect(r.warehouseName).toContain('MA')
  })

  it('handles null subTaxes', () => {
    const r = parseReceipt(rawApi)
    expect(r.tax).toBe(2.25) // falls back to taxes field
  })

  it('uses unit field as quantity', () => {
    const r = parseReceipt(rawApi)
    expect(r.items[0].quantity).toBe(1)
  })

  it('detects fuel receipt type', () => {
    const fuel = {
      ...rawApi,
      receiptType: 'Gas Station',
      documentType: 'FuelReceipts',
      itemArray: [{
        itemNumber: '1',
        itemDescription01: 'REGULAR',
        amount: 45.00,
        itemUnitPriceAmount: 3.459,
        fuelUnitQuantity: 13.01,
        fuelGradeCode: '1',
        fuelGradeDescription: 'Regular',
      }],
    }
    const r = parseReceipt(fuel)
    expect(r.receiptType).toBe('fuel')
    expect(r.items[0].fuelGallons).toBe(13.01)
    expect(r.items[0].fuelPricePerGallon).toBe(3.459)
  })

  it('works via parseReceiptsFromJson with array', () => {
    const result = parseReceiptsFromJson([rawApi])
    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(226.03)
  })
})
