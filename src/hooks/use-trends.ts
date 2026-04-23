import { useMemo } from 'react'
import { useReceipts } from './use-receipts'
import {
  computeMonthComparisons,
  computeMonthlySpend,
  computePriceMovers,
  computeShoppingDayIntensity,
  type MonthComparison,
  type MonthlySpend,
  type PriceMover,
  type ShoppingDayIntensity,
} from '../lib/trends'

export interface TrendsSummary {
  inflationRate: number | null // % change in avg unit price
  totalSpendChange: number | null // % change in total spending
  periodLabel: string // e.g. "2025 vs 2024"
  monthlySpend: MonthlySpend[]
  shoppingDays: ShoppingDayIntensity[]
  monthComparisons: MonthComparison[]
  topIncreases: PriceMover[]
  topDecreases: PriceMover[]
  availableYears: number[]
}

export function useTrends(yearA: number, yearB: number): TrendsSummary {
  const receipts = useReceipts()

  return useMemo(() => {
    const years = [...new Set(receipts.map((r) => new Date(r.transactionDate).getFullYear()))].sort()

    const monthlySpend = computeMonthlySpend(receipts)
    const movers = computePriceMovers(receipts, yearA, yearB)
    movers.sort((a, b) => b.changePercent - a.changePercent)

    const topIncreases = movers.filter((m) => m.changePercent > 0).slice(0, 10)
    const topDecreases = movers
      .filter((m) => m.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 10)

    // Overall inflation rate: avg of all item price changes weighted by purchase count
    let inflationRate: number | null = null
    let totalSpendChange: number | null = null

    if (movers.length > 0) {
      const totalWeight = movers.reduce((s, m) => s + m.purchaseCount, 0)
      inflationRate =
        Math.round(
          (movers.reduce((s, m) => s + m.changePercent * m.purchaseCount, 0) / totalWeight) * 10,
        ) / 10
    }

    // Total spend change
    const spendA = monthlySpend.filter((m) => m.year === yearA).reduce((s, m) => s + m.total, 0)
    const spendB = monthlySpend.filter((m) => m.year === yearB).reduce((s, m) => s + m.total, 0)
    if (spendA > 0 && spendB > 0) {
      totalSpendChange = Math.round(((spendB - spendA) / spendA) * 1000) / 10
    }

    const shoppingDays = computeShoppingDayIntensity(receipts, yearA, yearB)
    const monthComparisons = computeMonthComparisons(monthlySpend, yearA, yearB)

    return {
      inflationRate,
      totalSpendChange,
      periodLabel: `${yearB} vs ${yearA}`,
      monthlySpend,
      shoppingDays,
      monthComparisons,
      topIncreases,
      topDecreases,
      availableYears: years,
    }
  }, [receipts, yearA, yearB])
}
