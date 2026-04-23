import type { Receipt } from '../types/receipt'

export interface BasketPairInsight {
  itemNumberA: string
  descriptionA: string
  itemNumberB: string
  descriptionB: string
  pairCount: number
}

export interface SinglePurposeTripInsight {
  receipt: Receipt
  focusItemNumber: string
  focusDescription: string
  focusShare: number
}

export interface ProductCompanionInsight {
  itemNumber: string
  description: string
  pairCount: number
  togetherRate: number
}

export interface BasketIntelligenceSummary {
  topPairs: BasketPairInsight[]
  singlePurposeTrips: SinglePurposeTripInsight[]
}

function isGasReceipt(receipt: Receipt) {
  return receipt.receiptType === 'fuel' || (receipt.receiptType || '').toLowerCase().includes('gas')
}

function round1(value: number) {
  return Math.round(value * 10) / 10
}

export function computeBasketIntelligence(receipts: Receipt[]): BasketIntelligenceSummary {
  const pairMap = new Map<string, BasketPairInsight>()
  const singlePurposeTrips: SinglePurposeTripInsight[] = []

  for (const receipt of receipts) {
    if (isGasReceipt(receipt)) continue

    const items = receipt.items.filter((item) => item.itemNumber && item.amount > 0)
    if (items.length < 1) continue

    const uniqueItems = new Map<string, { itemNumber: string; description: string; amount: number }>()
    for (const item of items) {
      const existing = uniqueItems.get(item.itemNumber)
      if (existing) {
        existing.amount += item.amount
      } else {
        uniqueItems.set(item.itemNumber, {
          itemNumber: item.itemNumber,
          description: item.description,
          amount: item.amount,
        })
      }
    }

    const uniques = Array.from(uniqueItems.values()).sort((a, b) => a.itemNumber.localeCompare(b.itemNumber))
    const positiveTotal = uniques.reduce((sum, item) => sum + item.amount, 0)

    if (uniques.length <= 4 && positiveTotal > 0) {
      const lead = uniques.reduce((max, item) => (item.amount > max.amount ? item : max), uniques[0])
      const share = lead.amount / positiveTotal
      if (share >= 0.55) {
        singlePurposeTrips.push({
          receipt,
          focusItemNumber: lead.itemNumber,
          focusDescription: lead.description,
          focusShare: round1(share * 100),
        })
      }
    }

    if (uniques.length < 2) continue

    for (let i = 0; i < uniques.length; i += 1) {
      for (let j = i + 1; j < uniques.length; j += 1) {
        const a = uniques[i]
        const b = uniques[j]
        const key = `${a.itemNumber}::${b.itemNumber}`
        const existing = pairMap.get(key)
        if (existing) {
          existing.pairCount += 1
        } else {
          pairMap.set(key, {
            itemNumberA: a.itemNumber,
            descriptionA: a.description,
            itemNumberB: b.itemNumber,
            descriptionB: b.description,
            pairCount: 1,
          })
        }
      }
    }
  }

  return {
    topPairs: Array.from(pairMap.values())
      .sort((a, b) => b.pairCount - a.pairCount)
      .slice(0, 8),
    singlePurposeTrips: singlePurposeTrips
      .sort((a, b) => b.receipt.transactionDate.localeCompare(a.receipt.transactionDate))
      .slice(0, 6),
  }
}

export function computeProductCompanions(receipts: Receipt[], itemNumber: string): ProductCompanionInsight[] {
  const companionCounts = new Map<string, ProductCompanionInsight>()
  let hostReceiptCount = 0

  for (const receipt of receipts) {
    if (isGasReceipt(receipt)) continue
    const uniqueItems = new Map(receipt.items.filter((item) => item.itemNumber).map((item) => [item.itemNumber, item]))
    if (!uniqueItems.has(itemNumber)) continue

    hostReceiptCount += 1

    for (const [otherItemNumber, item] of uniqueItems) {
      if (otherItemNumber === itemNumber) continue
      const existing = companionCounts.get(otherItemNumber)
      if (existing) {
        existing.pairCount += 1
      } else {
        companionCounts.set(otherItemNumber, {
          itemNumber: otherItemNumber,
          description: item.description,
          pairCount: 1,
          togetherRate: 0,
        })
      }
    }
  }

  return Array.from(companionCounts.values())
    .map((companion) => ({
      ...companion,
      togetherRate: hostReceiptCount > 0 ? round1((companion.pairCount / hostReceiptCount) * 100) : 0,
    }))
    .sort((a, b) => {
      if (b.pairCount !== a.pairCount) return b.pairCount - a.pairCount
      return b.togetherRate - a.togetherRate
    })
    .slice(0, 6)
}
