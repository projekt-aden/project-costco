import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import type { Receipt, YearGroup, MonthGroup, DayGroup } from '../types/receipt'
import { parseReceiptsFromJson } from '../db/parse'
import { parseReceiptsFromPdf } from '../db/parse-pdf'

export function useReceipts() {
  const receipts = useLiveQuery(() =>
    db.receipts.orderBy('transactionDate').reverse().toArray()
  )

  return receipts ?? []
}

export function useSummary() {
  const receipts = useReceipts()

  const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0)
  const totalTax = receipts.reduce((sum, r) => sum + r.tax, 0)
  const totalSubtotal = receipts.reduce((sum, r) => sum + r.subtotal, 0)
  const receiptCount = receipts.length

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    totalSubtotal: Math.round(totalSubtotal * 100) / 100,
    receiptCount,
  }
}

export function useGroupedReceipts(): YearGroup[] {
  const receipts = useReceipts()
  return groupReceipts(receipts)
}

function groupReceipts(receipts: Receipt[]): YearGroup[] {
  const yearMap = new Map<number, Map<number, Receipt[]>>()

  for (const r of receipts) {
    const d = new Date(r.transactionDate)
    const year = d.getFullYear()
    const month = d.getMonth()

    if (!yearMap.has(year)) yearMap.set(year, new Map())
    const monthMap = yearMap.get(year)!
    if (!monthMap.has(month)) monthMap.set(month, [])
    monthMap.get(month)!.push(r)
  }

  const years: YearGroup[] = []

  for (const [year, monthMap] of yearMap) {
    const months: MonthGroup[] = []

    for (const [month, monthReceipts] of monthMap) {
      const dayMap = new Map<string, Receipt[]>()
      for (const r of monthReceipts) {
        if (!dayMap.has(r.transactionDate)) dayMap.set(r.transactionDate, [])
        dayMap.get(r.transactionDate)!.push(r)
      }

      const days: DayGroup[] = Array.from(dayMap.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, dayReceipts]) => ({
          date,
          total: dayReceipts.reduce((s, r) => s + r.total, 0),
          tax: dayReceipts.reduce((s, r) => s + r.tax, 0),
          receipts: dayReceipts,
        }))

      months.push({
        month,
        year,
        total: monthReceipts.reduce((s, r) => s + r.total, 0),
        tax: monthReceipts.reduce((s, r) => s + r.tax, 0),
        receiptCount: monthReceipts.length,
        days,
      })
    }

    months.sort((a, b) => b.month - a.month)

    years.push({
      year,
      total: months.reduce((s, m) => s + m.total, 0),
      tax: months.reduce((s, m) => s + m.tax, 0),
      receiptCount: months.reduce((s, m) => s + m.receiptCount, 0),
      months,
    })
  }

  years.sort((a, b) => b.year - a.year)
  return years
}

async function addReceipts(receipts: Receipt[]): Promise<number> {
  const existing = await db.receipts.toArray()
  const existingBarcodes = new Set(existing.map((r) => r.transactionBarcode))

  const newReceipts = receipts.filter(
    (r) => !r.transactionBarcode || !existingBarcodes.has(r.transactionBarcode)
  )

  if (newReceipts.length > 0) {
    await db.receipts.bulkAdd(newReceipts)
  }

  return newReceipts.length
}

export async function importReceiptsFromJson(jsonString: string): Promise<number> {
  const parsed = JSON.parse(jsonString)
  const receipts = parseReceiptsFromJson(parsed)
  return addReceipts(receipts)
}

export async function importReceiptsFromPdf(buffer: ArrayBuffer): Promise<number> {
  const receipts = await parseReceiptsFromPdf(buffer)
  return addReceipts(receipts)
}

export async function deleteReceipt(id: string) {
  await db.receipts.delete(id)
}

export async function deleteReceiptItem(receiptId: string, itemId: string) {
  const receipt = await db.receipts.get(receiptId)
  if (!receipt) return

  const item = receipt.items.find((i) => i.id === itemId)
  if (!item) return

  const updatedItems = receipt.items.filter((i) => i.id !== itemId)
  const subtotal = updatedItems.reduce((s, i) => s + i.amount, 0)
  const couponTotal = receipt.coupons.reduce((s, c) => s + c.amount, 0)
  const newTotal = subtotal + couponTotal + receipt.tax

  await db.receipts.update(receiptId, {
    items: updatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    total: Math.round(newTotal * 100) / 100,
  })
}

export async function clearAllData() {
  await db.receipts.clear()
}
