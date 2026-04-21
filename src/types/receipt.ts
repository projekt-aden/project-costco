/** Raw Costco receipt JSON as exported from costco.com GraphQL API */
export interface CostcoReceiptRaw {
  transactionDate: string
  transactionBarcode: string
  warehouseName: string
  total: string
  itemArray: CostcoItemRaw[]
  subTaxes?: Record<string, string | number>
  couponArray?: CostcoCouponRaw[]
  tenderArray?: CostcoTenderRaw[]
}

export interface CostcoItemRaw {
  itemNumber: string
  itemDescription01: string
  itemDescription02?: string
  amount: string | number
  itemUnitPriceAmount?: string | number
  quantity?: number
  unit?: string
  taxFlag?: string
}

export interface CostcoCouponRaw {
  itemNumber?: string
  itemDescription01?: string
  amount: string | number
}

export interface CostcoTenderRaw {
  tenderDescription?: string
  amount: string | number
}

/** Normalized receipt stored in IndexedDB */
export interface Receipt {
  id: string
  transactionDate: string // ISO date YYYY-MM-DD
  transactionBarcode: string
  warehouseName: string
  receiptType: string // "warehouse" | "fuel" | "carwash" | ""
  subtotal: number
  tax: number
  total: number
  items: ReceiptItem[]
  coupons: ReceiptCoupon[]
  importedAt: string // ISO datetime
}

export interface ReceiptItem {
  id: string
  itemNumber: string
  description: string
  description2?: string
  unitPrice: number
  quantity: number
  amount: number
  taxFlag?: string
  // Fuel-specific
  fuelGrade?: string
  fuelGallons?: number
  fuelPricePerGallon?: number
}

export interface ReceiptCoupon {
  itemNumber?: string
  description?: string
  amount: number
}

/** Grouping types for timeline */
export interface YearGroup {
  year: number
  total: number
  tax: number
  receiptCount: number
  months: MonthGroup[]
}

export interface MonthGroup {
  month: number // 0-11
  year: number
  total: number
  tax: number
  receiptCount: number
  days: DayGroup[]
}

export interface DayGroup {
  date: string // ISO YYYY-MM-DD
  total: number
  tax: number
  receipts: Receipt[]
}
