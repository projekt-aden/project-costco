import type { Receipt } from '../types/receipt'

export interface MonthlySpend {
  key: string
  year: number
  month: number
  total: number
  receiptCount: number
  itemCount: number
}

export interface PriceMover {
  itemNumber: string
  description: string
  oldPrice: number
  newPrice: number
  changePercent: number
  purchaseCount: number
}

export interface ShoppingDayIntensity {
  date: string
  total: number
  receiptCount: number
  weekday: number
  weekIndex: number
  month: number
  year: number
}

export interface MonthComparison {
  month: number
  label: string
  spendA: number
  spendB: number
  changePercent: number | null
  tripDelta: number
}

function avg(arr: number[]): number {
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function isGasReceipt(receipt: Receipt) {
  return receipt.receiptType === 'fuel' || (receipt.receiptType || '').toLowerCase().includes('gas')
}

export function computeMonthlySpend(receipts: Receipt[]): MonthlySpend[] {
  const monthMap = new Map<string, MonthlySpend>()

  for (const receipt of receipts) {
    if (isGasReceipt(receipt)) continue
    const date = new Date(receipt.transactionDate)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!monthMap.has(key)) {
      monthMap.set(key, {
        key,
        year: date.getFullYear(),
        month: date.getMonth(),
        total: 0,
        receiptCount: 0,
        itemCount: 0,
      })
    }
    const month = monthMap.get(key)!
    month.total += receipt.total
    month.receiptCount += 1
    month.itemCount += receipt.items.length
  }

  return Array.from(monthMap.values()).sort((a, b) => a.key.localeCompare(b.key))
}

export function computePriceMovers(receipts: Receipt[], yearA: number, yearB: number): PriceMover[] {
  const itemPrices = new Map<string, Map<number, number[]>>()
  const descriptions = new Map<string, string>()

  for (const receipt of receipts) {
    if (isGasReceipt(receipt)) continue
    const year = new Date(receipt.transactionDate).getFullYear()

    for (const item of receipt.items) {
      if (!item.itemNumber) continue
      if (!itemPrices.has(item.itemNumber)) itemPrices.set(item.itemNumber, new Map())
      const yearMap = itemPrices.get(item.itemNumber)!
      if (!yearMap.has(year)) yearMap.set(year, [])
      yearMap.get(year)!.push(item.unitPrice)
      if (!descriptions.has(item.itemNumber)) descriptions.set(item.itemNumber, item.description)
    }
  }

  const movers: PriceMover[] = []

  for (const [itemNumber, yearMap] of itemPrices) {
    const pricesA = yearMap.get(yearA)
    const pricesB = yearMap.get(yearB)
    if (!pricesA || !pricesB || pricesA.length === 0 || pricesB.length === 0) continue

    const avgA = avg(pricesA)
    const avgB = avg(pricesB)
    if (avgA === 0) continue

    movers.push({
      itemNumber,
      description: descriptions.get(itemNumber) || itemNumber,
      oldPrice: Math.round(avgA * 100) / 100,
      newPrice: Math.round(avgB * 100) / 100,
      changePercent: Math.round((((avgB - avgA) / avgA) * 100) * 10) / 10,
      purchaseCount: pricesA.length + pricesB.length,
    })
  }

  return movers.sort((a, b) => b.changePercent - a.changePercent)
}

export function computeShoppingDayIntensity(receipts: Receipt[], yearA: number, yearB: number): ShoppingDayIntensity[] {
  const activeYears = new Set([yearA, yearB])
  const dayMap = new Map<string, { date: string; total: number; receiptCount: number }>()

  for (const receipt of receipts) {
    if (isGasReceipt(receipt)) continue
    const year = new Date(receipt.transactionDate).getFullYear()
    if (!activeYears.has(year)) continue

    const existing = dayMap.get(receipt.transactionDate)
    if (existing) {
      existing.total += receipt.total
      existing.receiptCount += 1
    } else {
      dayMap.set(receipt.transactionDate, {
        date: receipt.transactionDate,
        total: receipt.total,
        receiptCount: 1,
      })
    }
  }

  return Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      const date = new Date(`${day.date}T00:00:00`)
      const startOfYear = new Date(date.getFullYear(), 0, 1)
      const daysFromYearStart = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000)
      return {
        date: day.date,
        total: Math.round(day.total * 100) / 100,
        receiptCount: day.receiptCount,
        weekday: date.getDay(),
        weekIndex: Math.floor((daysFromYearStart + startOfYear.getDay()) / 7),
        month: date.getMonth(),
        year: date.getFullYear(),
      }
    })
}

export function computeMonthComparisons(
  monthlySpend: MonthlySpend[],
  yearA: number,
  yearB: number,
): MonthComparison[] {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const byYearMonth = new Map<string, MonthlySpend>()
  for (const month of monthlySpend) {
    byYearMonth.set(`${month.year}-${month.month}`, month)
  }

  return monthNames.map((label, month) => {
    const a = byYearMonth.get(`${yearA}-${month}`)
    const b = byYearMonth.get(`${yearB}-${month}`)
    const spendA = a?.total ?? 0
    const spendB = b?.total ?? 0
    return {
      month,
      label,
      spendA: Math.round(spendA * 100) / 100,
      spendB: Math.round(spendB * 100) / 100,
      changePercent: spendA > 0 && spendB > 0 ? Math.round((((spendB - spendA) / spendA) * 100) * 10) / 10 : null,
      tripDelta: (b?.receiptCount ?? 0) - (a?.receiptCount ?? 0),
    }
  })
}
