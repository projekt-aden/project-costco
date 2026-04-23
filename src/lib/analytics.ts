import type { ProductAggregate, ProductHabitInsight } from '../types/product'
import type { DayGroup, MonthGroup, Receipt, YearGroup } from '../types/receipt'

export interface SummaryMetrics {
  totalSpent: number
  totalTax: number
  totalSubtotal: number
  receiptCount: number
  averagePerTrip: number
  totalItems: number
  uniqueItems: number
  busiestMonth: string | null
}

export interface SearchReceiptMatch {
  receipt: Receipt
  reasons: string[]
}

export interface SearchProductMatch {
  product: ProductAggregate
  reasons: string[]
}

export interface ProductHabitCollections {
  coreStaples: ProductHabitInsight[]
  emergingStaples: ProductHabitInsight[]
  coolingOff: ProductHabitInsight[]
}

export interface ProductPriceSummary {
  minPrice: number
  maxPrice: number
  averagePrice: number
  latestPrice: number
  firstPrice: number
  latestDate: string
  firstDate: string
  changePercent: number | null
  volatilityPercent: number
}

export interface SpendFrequencyPoint {
  itemNumber: string
  description: string
  purchaseCount: number
  totalSpent: number
  purchaseMonthsCount: number
  stapleScore: number
  xRatio: number
  yRatio: number
  radius: number
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
})

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

function daysBetween(a: string, b: string) {
  const utcA = new Date(`${a}T00:00:00Z`).getTime()
  const utcB = new Date(`${b}T00:00:00Z`).getTime()
  return Math.round((utcB - utcA) / 86_400_000)
}

export function normalizeSearchText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function computeSummaryMetrics(receipts: Receipt[]): SummaryMetrics {
  const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total, 0)
  const totalTax = receipts.reduce((sum, receipt) => sum + receipt.tax, 0)
  const totalSubtotal = receipts.reduce((sum, receipt) => sum + receipt.subtotal, 0)
  const totalItems = receipts.reduce((sum, receipt) => sum + receipt.items.length, 0)
  const uniqueItems = new Set(
    receipts.flatMap((receipt) => receipt.items.map((item) => item.itemNumber).filter(Boolean)),
  ).size

  const monthSpend = new Map<string, number>()
  for (const receipt of receipts) {
    const monthKey = receipt.transactionDate.slice(0, 7)
    monthSpend.set(monthKey, (monthSpend.get(monthKey) || 0) + receipt.total)
  }

  let busiestMonth: string | null = null
  let busiestMonthSpend = -1
  for (const [monthKey, spend] of monthSpend) {
    if (spend > busiestMonthSpend) {
      busiestMonthSpend = spend
      busiestMonth = monthKey
    }
  }

  return {
    totalSpent: roundCurrency(totalSpent),
    totalTax: roundCurrency(totalTax),
    totalSubtotal: roundCurrency(totalSubtotal),
    receiptCount: receipts.length,
    averagePerTrip: receipts.length > 0 ? roundCurrency(totalSpent / receipts.length) : 0,
    totalItems,
    uniqueItems,
    busiestMonth: busiestMonth
      ? MONTH_LABEL.format(new Date(`${busiestMonth}-01T00:00:00`))
      : null,
  }
}

export function groupReceipts(receipts: Receipt[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, Receipt[]>>()

  for (const receipt of receipts) {
    const date = new Date(receipt.transactionDate)
    const year = date.getFullYear()
    const month = date.getMonth()

    if (!yearMap.has(year)) yearMap.set(year, new Map())
    const monthMap = yearMap.get(year)!
    if (!monthMap.has(month)) monthMap.set(month, [])
    monthMap.get(month)!.push(receipt)
  }

  const years: YearGroup[] = []

  for (const [year, monthMap] of yearMap) {
    const months: MonthGroup[] = []

    for (const [month, monthReceipts] of monthMap) {
      const dayMap = new Map<string, Receipt[]>()
      for (const receipt of monthReceipts) {
        if (!dayMap.has(receipt.transactionDate)) dayMap.set(receipt.transactionDate, [])
        dayMap.get(receipt.transactionDate)!.push(receipt)
      }

      const days: DayGroup[] = Array.from(dayMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayReceipts]) => ({
          date,
          total: dayReceipts.reduce((sum, receipt) => sum + receipt.total, 0),
          tax: dayReceipts.reduce((sum, receipt) => sum + receipt.tax, 0),
          receipts: dayReceipts,
        }))

      months.push({
        month,
        year,
        total: monthReceipts.reduce((sum, receipt) => sum + receipt.total, 0),
        tax: monthReceipts.reduce((sum, receipt) => sum + receipt.tax, 0),
        receiptCount: monthReceipts.length,
        days,
      })
    }

    months.sort((a, b) => b.month - a.month)
    years.push({
      year,
      total: months.reduce((sum, month) => sum + month.total, 0),
      tax: months.reduce((sum, month) => sum + month.tax, 0),
      receiptCount: months.reduce((sum, month) => sum + month.receiptCount, 0),
      months,
    })
  }

  years.sort((a, b) => b.year - a.year)
  return years
}

export function buildProductAggregates(receipts: Receipt[]): ProductAggregate[] {
  const map = new Map<string, ProductAggregate>()

  for (const receipt of receipts) {
    for (const item of receipt.items) {
      const key = item.itemNumber
      if (!key) continue

      let aggregate = map.get(key)
      if (!aggregate) {
        aggregate = {
          itemNumber: key,
          description: item.description,
          purchaseCount: 0,
          totalGallons: 0,
          totalSpent: 0,
          prices: [],
          purchases: [],
          firstPurchased: receipt.transactionDate,
          lastPurchased: receipt.transactionDate,
          averageDaysBetweenPurchases: null,
          purchaseMonthsCount: 0,
          stapleScore: 0,
          daysSinceLastPurchase: 0,
        }
        map.set(key, aggregate)
      }

      aggregate.purchaseCount += item.fuelGallons ? 1 : item.quantity
      aggregate.totalGallons += item.fuelGallons || 0
      aggregate.totalSpent += item.amount

      aggregate.prices.push({
        date: receipt.transactionDate,
        unitPrice: item.unitPrice,
      })

      aggregate.purchases.push({
        date: receipt.transactionDate,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        total: item.amount,
        warehouse: receipt.warehouseName,
        receiptId: receipt.id,
      })

      if (receipt.transactionDate < aggregate.firstPurchased) {
        aggregate.firstPurchased = receipt.transactionDate
      }
      if (receipt.transactionDate > aggregate.lastPurchased) {
        aggregate.lastPurchased = receipt.transactionDate
      }
    }
  }

  for (const aggregate of map.values()) {
    aggregate.prices.sort((a, b) => a.date.localeCompare(b.date))
    aggregate.purchases.sort((a, b) => b.date.localeCompare(a.date))
    aggregate.totalSpent = roundCurrency(aggregate.totalSpent)

    const purchaseDatesAsc = aggregate.purchases
      .map((purchase) => purchase.date)
      .slice()
      .sort((a, b) => a.localeCompare(b))
    const uniqueMonths = new Set(purchaseDatesAsc.map((date) => date.slice(0, 7)))
    aggregate.purchaseMonthsCount = uniqueMonths.size

    if (purchaseDatesAsc.length > 1) {
      const intervals: number[] = []
      for (let index = 1; index < purchaseDatesAsc.length; index += 1) {
        intervals.push(daysBetween(purchaseDatesAsc[index - 1], purchaseDatesAsc[index]))
      }
      aggregate.averageDaysBetweenPurchases = round1(
        intervals.reduce((sum, value) => sum + value, 0) / intervals.length,
      )
    }

    const spanDays = Math.max(daysBetween(aggregate.firstPurchased, aggregate.lastPurchased), 1)
    const spanMonths = Math.max(spanDays / 30, 1)
    aggregate.stapleScore = round1(
      aggregate.purchaseMonthsCount * 3 + aggregate.purchaseCount / spanMonths,
    )
  }

  const latestReceiptDate = receipts.reduce(
    (latest, receipt) => (receipt.transactionDate > latest ? receipt.transactionDate : latest),
    '',
  )

  for (const aggregate of map.values()) {
    aggregate.daysSinceLastPurchase = latestReceiptDate
      ? Math.max(daysBetween(aggregate.lastPurchased, latestReceiptDate), 0)
      : 0
  }

  return Array.from(map.values()).sort((a, b) => b.purchaseCount - a.purchaseCount)
}

export function buildProductHabitCollections(products: ProductAggregate[]): ProductHabitCollections {
  const regularProducts = products.filter((product) => product.totalGallons === 0 && product.totalSpent >= 0)

  const coreStaples = regularProducts
    .filter(
      (product) =>
        product.purchaseMonthsCount >= 3 &&
        product.purchaseCount >= 4 &&
        (product.averageDaysBetweenPurchases === null || product.averageDaysBetweenPurchases <= 75),
    )
    .sort((a, b) => b.stapleScore - a.stapleScore)
    .slice(0, 6)
    .map((product) => ({
      product,
      label: 'Core staple',
      description:
        product.averageDaysBetweenPurchases !== null
          ? `Bought across ${product.purchaseMonthsCount} months, about every ${Math.round(product.averageDaysBetweenPurchases)} days`
          : `Bought across ${product.purchaseMonthsCount} different months`,
    }))

  const emergingStaples = regularProducts
    .filter(
      (product) =>
        product.purchaseCount >= 2 &&
        product.purchaseMonthsCount >= 2 &&
        product.daysSinceLastPurchase <= 45 &&
        daysBetween(product.firstPurchased, product.lastPurchased) <= 120,
    )
    .sort((a, b) => {
      if (a.firstPurchased !== b.firstPurchased) {
        return b.firstPurchased.localeCompare(a.firstPurchased)
      }
      return b.stapleScore - a.stapleScore
    })
    .slice(0, 6)
    .map((product) => ({
      product,
      label: 'Emerging',
      description: `Newer repeat buy with ${product.purchaseCount} purchases across ${product.purchaseMonthsCount} months`,
    }))

  const coolingOff = regularProducts
    .filter((product) => {
      if (product.purchaseCount < 2 || product.purchaseMonthsCount < 2) return false
      if (product.averageDaysBetweenPurchases === null) return product.daysSinceLastPurchase >= 90
      return product.daysSinceLastPurchase >= Math.max(product.averageDaysBetweenPurchases * 1.75, 75)
    })
    .sort((a, b) => b.daysSinceLastPurchase - a.daysSinceLastPurchase)
    .slice(0, 6)
    .map((product) => ({
      product,
      label: 'Cooling off',
      description:
        product.averageDaysBetweenPurchases !== null
          ? `Used to repeat every ~${Math.round(product.averageDaysBetweenPurchases)} days, last bought ${product.daysSinceLastPurchase} days ago`
          : `Not seen in ${product.daysSinceLastPurchase} days`,
    }))

  return {
    coreStaples,
    emergingStaples,
    coolingOff,
  }
}

export function computeProductPriceSummary(prices: { date: string; unitPrice: number }[]): ProductPriceSummary | null {
  if (prices.length === 0) return null

  const sorted = prices.slice().sort((a, b) => a.date.localeCompare(b.date))
  const values = sorted.map((price) => price.unitPrice)
  const minPrice = Math.min(...values)
  const maxPrice = Math.max(...values)
  const averagePrice = values.reduce((sum, value) => sum + value, 0) / values.length
  const firstPrice = sorted[0].unitPrice
  const latestPrice = sorted[sorted.length - 1].unitPrice
  const changePercent =
    firstPrice > 0 ? round1(((latestPrice - firstPrice) / firstPrice) * 100) : null

  return {
    minPrice: roundCurrency(minPrice),
    maxPrice: roundCurrency(maxPrice),
    averagePrice: roundCurrency(averagePrice),
    latestPrice: roundCurrency(latestPrice),
    firstPrice: roundCurrency(firstPrice),
    latestDate: sorted[sorted.length - 1].date,
    firstDate: sorted[0].date,
    changePercent,
    volatilityPercent: averagePrice > 0 ? round1(((maxPrice - minPrice) / averagePrice) * 100) : 0,
  }
}

export function buildSpendFrequencyPoints(products: ProductAggregate[]): SpendFrequencyPoint[] {
  const nonFuel = products.filter((product) => product.totalGallons === 0 && product.totalSpent > 0)
  if (nonFuel.length === 0) return []

  const maxPurchases = Math.max(...nonFuel.map((product) => product.purchaseCount), 1)
  const maxSpend = Math.max(...nonFuel.map((product) => product.totalSpent), 1)
  const maxMonths = Math.max(...nonFuel.map((product) => product.purchaseMonthsCount), 1)

  return nonFuel.map((product) => ({
    itemNumber: product.itemNumber,
    description: product.description,
    purchaseCount: product.purchaseCount,
    totalSpent: product.totalSpent,
    purchaseMonthsCount: product.purchaseMonthsCount,
    stapleScore: product.stapleScore,
    xRatio: Math.sqrt(product.purchaseCount / maxPurchases),
    yRatio: Math.sqrt(product.totalSpent / maxSpend),
    radius: 5 + (product.purchaseMonthsCount / maxMonths) * 8,
  }))
}

export function searchReceipts(receipts: Receipt[], query: string): SearchReceiptMatch[] {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []

  return receipts
    .map((receipt) => {
      const reasons = new Set<string>()
      const haystacks = [
        { value: receipt.warehouseName, reason: 'warehouse' },
        { value: receipt.transactionBarcode, reason: 'barcode' },
        { value: receipt.transactionDate, reason: 'date' },
      ]

      for (const haystack of haystacks) {
        if (normalizeSearchText(haystack.value).includes(normalized)) {
          reasons.add(haystack.reason)
        }
      }

      for (const item of receipt.items) {
        if (normalizeSearchText(item.description).includes(normalized)) reasons.add('item')
        if (normalizeSearchText(item.itemNumber).includes(normalized)) reasons.add('item #')
      }

      if (reasons.size === 0) return null
      return {
        receipt,
        reasons: Array.from(reasons),
      }
    })
    .filter((match): match is SearchReceiptMatch => Boolean(match))
    .sort((a, b) => b.receipt.transactionDate.localeCompare(a.receipt.transactionDate))
}

export function searchProducts(products: ProductAggregate[], query: string): SearchProductMatch[] {
  const normalized = normalizeSearchText(query)
  if (!normalized) return []

  return products
    .map((product) => {
      const reasons = new Set<string>()
      if (normalizeSearchText(product.description).includes(normalized)) reasons.add('name')
      if (normalizeSearchText(product.itemNumber).includes(normalized)) reasons.add('item #')
      if (product.purchases.some((purchase) => normalizeSearchText(purchase.warehouse).includes(normalized))) {
        reasons.add('warehouse')
      }

      if (reasons.size === 0) return null
      return {
        product,
        reasons: Array.from(reasons),
      }
    })
    .filter((match): match is SearchProductMatch => Boolean(match))
    .sort((a, b) => {
      if (b.product.stapleScore !== a.product.stapleScore) {
        return b.product.stapleScore - a.product.stapleScore
      }
      return b.product.lastPurchased.localeCompare(a.product.lastPurchased)
    })
}
