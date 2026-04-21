import { useMemo } from 'react'
import { useFilteredReceipts } from './use-year-filter'
import type { ProductAggregate } from '../types/product'

export function useProductAggregates(): ProductAggregate[] {
  const receipts = useFilteredReceipts()

  return useMemo(() => {
    const map = new Map<string, ProductAggregate>()

    for (const receipt of receipts) {
      for (const item of receipt.items) {
        const key = item.itemNumber
        if (!key) continue

        let agg = map.get(key)
        if (!agg) {
          agg = {
            itemNumber: key,
            description: item.description,
            purchaseCount: 0,
            totalGallons: 0,
            totalSpent: 0,
            prices: [],
            purchases: [],
            lastPurchased: receipt.transactionDate,
          }
          map.set(key, agg)
        }

        agg.purchaseCount += item.fuelGallons ? 1 : item.quantity
        agg.totalGallons += item.fuelGallons || 0
        agg.totalSpent += item.amount

        agg.prices.push({
          date: receipt.transactionDate,
          unitPrice: item.unitPrice,
        })

        agg.purchases.push({
          date: receipt.transactionDate,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          total: item.amount,
          warehouse: receipt.warehouseName,
          receiptId: receipt.id,
        })

        if (receipt.transactionDate > agg.lastPurchased) {
          agg.lastPurchased = receipt.transactionDate
        }
      }
    }

    for (const agg of map.values()) {
      agg.prices.sort((a, b) => a.date.localeCompare(b.date))
      agg.purchases.sort((a, b) => b.date.localeCompare(a.date))
      agg.totalSpent = Math.round(agg.totalSpent * 100) / 100
    }

    return Array.from(map.values()).sort((a, b) => b.purchaseCount - a.purchaseCount)
  }, [receipts])
}

export function useProductAggregate(itemNumber: string): ProductAggregate | undefined {
  const all = useProductAggregates()
  return all.find((p) => p.itemNumber === itemNumber)
}
