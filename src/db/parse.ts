import type { Receipt, ReceiptItem, ReceiptCoupon } from '../types/receipt'

type RawReceiptItem = {
  fuelGradeCode?: string | null
  fuelUnitQuantity?: string | number | null
  itemUnitPriceAmount?: string | number | null
  amount?: string | number | null
  itemNumber?: string
  itemDescription01?: string
  itemDescription02?: string
  fuelGradeDescription?: string | null
  unit?: string | number | null
  quantity?: string | number | null
  taxFlag?: string | null
}

type RawReceiptCoupon = {
  itemNumber?: string
  itemDescription01?: string
  amount?: string | number | null
}

type RawReceipt = {
  itemArray?: RawReceiptItem[]
  couponArray?: RawReceiptCoupon[]
  receiptType?: string
  documentType?: string
  total?: string | number | null
  taxes?: string | number | null
  subTaxes?: Record<string, string | number | null | undefined> | null
  subTotal?: string | number | null
  transactionDate?: string
  transactionDateTime?: string
  warehouseCity?: string
  warehouseState?: string
  warehouseName?: string
  transactionBarcode?: string
}

function toNumber(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0
  const n = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val
  return isNaN(n) ? 0 : n
}

function parseDate(raw: string): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw.slice(0, 10)
  }
  const parts = raw.split('/')
  if (parts.length === 3) {
    const [m, d, y] = parts
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return raw
}

let counter = 0

function makeId(): string {
  counter++
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}

export function parseReceipt(raw: RawReceipt): Receipt {
  const itemArray = raw.itemArray || []
  const typeStr = ((raw.receiptType || '') + ' ' + (raw.documentType || '')).toLowerCase()
  const isFuel = typeStr.includes('fuel') || typeStr.includes('gas')

  const items: ReceiptItem[] = itemArray.map((item) => {
    const hasFuel = isFuel && !!item.fuelGradeCode && toNumber(item.fuelUnitQuantity) > 0
    const gallons = hasFuel ? toNumber(item.fuelUnitQuantity) : undefined
    const ppg = hasFuel ? toNumber(item.itemUnitPriceAmount) : undefined

    return {
      id: makeId(),
      itemNumber: item.itemNumber || '',
      description: item.itemDescription01 || (hasFuel && item.fuelGradeDescription) || '',
      description2: item.itemDescription02 || undefined,
      unitPrice: toNumber(item.itemUnitPriceAmount || item.amount),
      quantity: hasFuel ? (gallons || 1) : (toNumber(item.unit || item.quantity) || 1),
      amount: toNumber(item.amount),
      taxFlag: item.taxFlag || undefined,
      fuelGrade: hasFuel ? (item.fuelGradeDescription || undefined) : undefined,
      fuelGallons: gallons,
      fuelPricePerGallon: ppg,
    }
  })

  const coupons: ReceiptCoupon[] = (raw.couponArray || []).map((c) => ({
    itemNumber: c.itemNumber,
    description: c.itemDescription01,
    amount: toNumber(c.amount),
  }))

  const total = toNumber(raw.total)
  let tax = toNumber(raw.taxes)
  if (!tax && raw.subTaxes && typeof raw.subTaxes === 'object') {
    tax = Object.values(raw.subTaxes as Record<string, string | number | null | undefined>)
      .reduce((sum: number, v) => sum + toNumber(v), 0)
  }
  const subtotal = raw.subTotal ? toNumber(raw.subTotal) : total - tax

  const dateStr = raw.transactionDate || raw.transactionDateTime || ''
  const warehouse = raw.warehouseCity
    ? `${raw.warehouseName || ''} — ${raw.warehouseCity}, ${raw.warehouseState || ''}`
    : raw.warehouseName || ''

  return {
    id: makeId(),
    transactionDate: parseDate(dateStr),
    transactionBarcode: raw.transactionBarcode || '',
    warehouseName: warehouse,
    receiptType: isFuel ? 'fuel' : (raw.receiptType || raw.documentType || '').toLowerCase(),
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    items,
    coupons,
    importedAt: new Date().toISOString(),
  }
}

export function parseReceiptsFromJson(json: unknown): Receipt[] {
  if (Array.isArray(json)) {
    return json.map((entry) => parseReceipt(entry as RawReceipt))
  }
  if (typeof json === 'object' && json !== null) {
    return [parseReceipt(json as RawReceipt)]
  }
  throw new Error('Invalid receipt format: expected JSON object or array')
}
