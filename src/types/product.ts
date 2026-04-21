/** Cached product image/info from external API */
export interface ProductCache {
  itemNumber: string // primary key
  imageUrl: string | null // null = no image found
  title: string | null
  brand: string | null
  notFound: boolean // true = API confirmed no results, don't retry
  fetchedAt: string // ISO datetime
}

/** Aggregated product across all receipts */
export interface ProductAggregate {
  itemNumber: string
  description: string
  purchaseCount: number
  totalGallons: number // fuel only, 0 for regular items
  totalSpent: number
  prices: PricePoint[]
  purchases: PurchaseRecord[]
  lastPurchased: string // ISO date
}

export interface PricePoint {
  date: string // ISO date
  unitPrice: number
}

export interface PurchaseRecord {
  date: string // ISO date
  unitPrice: number
  quantity: number
  total: number
  warehouse: string
  receiptId: string
}
