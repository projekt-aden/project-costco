import { useMemo } from 'react'
import { useFilteredReceipts } from './use-year-filter'
import { buildProductAggregates, buildProductHabitCollections } from '../lib/analytics'
import type { ProductAggregate, ProductHabitInsight } from '../types/product'

export function useProductAggregates(): ProductAggregate[] {
  const receipts = useFilteredReceipts()
  return useMemo(() => buildProductAggregates(receipts), [receipts])
}

export function useProductAggregate(itemNumber: string): ProductAggregate | undefined {
  const all = useProductAggregates()
  return all.find((p) => p.itemNumber === itemNumber)
}

export function useProductHabitInsights(): {
  coreStaples: ProductHabitInsight[]
  emergingStaples: ProductHabitInsight[]
  coolingOff: ProductHabitInsight[]
} {
  const products = useProductAggregates()
  return useMemo(() => buildProductHabitCollections(products), [products])
}
