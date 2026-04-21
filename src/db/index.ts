import Dexie, { type EntityTable } from 'dexie'
import type { Receipt } from '../types/receipt'
import type { ProductCache } from '../types/product'

const db = new Dexie('CostcoTracker') as Dexie & {
  receipts: EntityTable<Receipt, 'id'>
  productCache: EntityTable<ProductCache, 'itemNumber'>
}

db.version(1).stores({
  receipts: 'id, transactionDate, transactionBarcode, warehouseName, importedAt',
})

db.version(2).stores({
  receipts: 'id, transactionDate, transactionBarcode, warehouseName, importedAt',
  productCache: 'itemNumber',
})

export { db }
