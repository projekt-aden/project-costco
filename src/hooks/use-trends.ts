import { useMemo } from 'react'
import { useReceipts } from './use-receipts'
import type { Receipt } from '../types/receipt'

export interface MonthlySpend {
  key: string // "2025-03"
  year: number
  month: number
  total: number
  receiptCount: number
  itemCount: number
}

export interface PriceMover {
  itemNumber: string
  description: string
  oldPrice: number // avg unit price in earlier period
  newPrice: number // avg unit price in later period
  changePercent: number
  purchaseCount: number
}

export interface TrendsSummary {
  inflationRate: number | null // % change in avg unit price
  totalSpendChange: number | null // % change in total spending
  periodLabel: string // e.g. "2025 vs 2024"
  monthlySpend: MonthlySpend[]
  topIncreases: PriceMover[]
  topDecreases: PriceMover[]
  availableYears: number[]
}

function getItemPricesByYear(receipts: Receipt[]): Map<string, Map<number, number[]>> {
  // itemNumber → year → unitPrices[]
  const map = new Map<string, Map<number, number[]>>()

  for (const r of receipts) {
    if (r.receiptType === 'fuel' || (r.receiptType || '').toLowerCase().includes('gas')) continue
    const year = new Date(r.transactionDate).getFullYear()

    for (const item of r.items) {
      if (!item.itemNumber) continue
      if (!map.has(item.itemNumber)) map.set(item.itemNumber, new Map())
      const yearMap = map.get(item.itemNumber)!
      if (!yearMap.has(year)) yearMap.set(year, [])
      yearMap.get(year)!.push(item.unitPrice)
    }
  }

  return map
}

function getItemDescriptions(receipts: Receipt[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const r of receipts) {
    for (const item of r.items) {
      if (item.itemNumber && !map.has(item.itemNumber)) {
        map.set(item.itemNumber, item.description)
      }
    }
  }
  return map
}

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

export function useTrends(yearA: number, yearB: number): TrendsSummary {
  const receipts = useReceipts()

  return useMemo(() => {
    const years = [...new Set(receipts.map((r) => new Date(r.transactionDate).getFullYear()))].sort()

    // Monthly spending
    const monthMap = new Map<string, MonthlySpend>()
    for (const r of receipts) {
      if ((r.receiptType || '').toLowerCase().includes('gas')) continue
      const d = new Date(r.transactionDate)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          year: d.getFullYear(),
          month: d.getMonth(),
          total: 0,
          receiptCount: 0,
          itemCount: 0,
        })
      }
      const m = monthMap.get(key)!
      m.total += r.total
      m.receiptCount += 1
      m.itemCount += r.items.length
    }
    const monthlySpend = Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key))

    // Price movers: compare yearA vs yearB
    const itemPrices = getItemPricesByYear(receipts)
    const descriptions = getItemDescriptions(receipts)
    const movers: PriceMover[] = []

    for (const [itemNumber, yearMap] of itemPrices) {
      const pricesA = yearMap.get(yearA)
      const pricesB = yearMap.get(yearB)
      if (!pricesA || !pricesB || pricesA.length === 0 || pricesB.length === 0) continue

      const avgA = avg(pricesA)
      const avgB = avg(pricesB)
      if (avgA === 0) continue

      const changePercent = ((avgB - avgA) / avgA) * 100

      movers.push({
        itemNumber,
        description: descriptions.get(itemNumber) || itemNumber,
        oldPrice: Math.round(avgA * 100) / 100,
        newPrice: Math.round(avgB * 100) / 100,
        changePercent: Math.round(changePercent * 10) / 10,
        purchaseCount: pricesA.length + pricesB.length,
      })
    }

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

    return {
      inflationRate,
      totalSpendChange,
      periodLabel: `${yearB} vs ${yearA}`,
      monthlySpend,
      topIncreases,
      topDecreases,
      availableYears: years,
    }
  }, [receipts, yearA, yearB])
}
