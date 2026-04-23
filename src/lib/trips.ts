import type { Receipt } from '../types/receipt'

export type TripArchetype = 'gas-stop' | 'quick-refill' | 'big-haul' | 'stock-up' | 'mixed-run'

export interface TripProfile {
  receipt: Receipt
  archetype: TripArchetype
  label: string
  description: string
  uniqueItems: number
  totalUnits: number
  maxQuantity: number
  total: number
}

export interface TripBehaviorSummary {
  profiles: TripProfile[]
  counts: Record<TripArchetype, number>
  averageBasketSpend: number
  averageUniqueItems: number
  biggestHaul: TripProfile | null
  quickestRefill: TripProfile | null
  latestStockUp: TripProfile | null
}

function isGasReceipt(receipt: Receipt) {
  return receipt.receiptType === 'fuel' || (receipt.receiptType || '').toLowerCase().includes('gas')
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export function profileTrip(receipt: Receipt): TripProfile {
  const uniqueItems = receipt.items.length
  const totalUnits = receipt.items.reduce((sum, item) => sum + Math.max(item.quantity || 0, 1), 0)
  const maxQuantity = receipt.items.reduce((max, item) => Math.max(max, item.quantity || 1), 1)
  const avgUnitsPerItem = uniqueItems > 0 ? totalUnits / uniqueItems : 0

  let archetype: TripArchetype = 'mixed-run'
  let label = 'Mixed Run'
  let description = 'A balanced Costco stop that mixes regular staples and one-off purchases.'

  if (isGasReceipt(receipt)) {
    archetype = 'gas-stop'
    label = 'Gas Stop'
    description = 'Fuel-only visit focused on filling up and moving on.'
  } else if (receipt.total >= 250 || uniqueItems >= 12 || totalUnits >= 18) {
    archetype = 'big-haul'
    label = 'Big Haul'
    description = 'Heavy spend or a large basket that looks like a full stock-up run.'
  } else if (
    maxQuantity >= 3 ||
    (uniqueItems <= 6 && avgUnitsPerItem >= 2.2) ||
    (receipt.total >= 120 && uniqueItems <= 8)
  ) {
    archetype = 'stock-up'
    label = 'Stock-Up'
    description = 'Concentrated trip with repeat quantities or a compact bulk basket.'
  } else if (uniqueItems <= 5 && receipt.total <= 90) {
    archetype = 'quick-refill'
    label = 'Quick Refill'
    description = 'Small grab-and-go trip for a short list of essentials.'
  }

  return {
    receipt,
    archetype,
    label,
    description,
    uniqueItems,
    totalUnits,
    maxQuantity,
    total: roundCurrency(receipt.total),
  }
}

export function computeTripBehavior(receipts: Receipt[]): TripBehaviorSummary {
  const profiles = receipts
    .map(profileTrip)
    .sort((a, b) => b.receipt.transactionDate.localeCompare(a.receipt.transactionDate))

  const counts: Record<TripArchetype, number> = {
    'gas-stop': 0,
    'quick-refill': 0,
    'big-haul': 0,
    'stock-up': 0,
    'mixed-run': 0,
  }

  for (const profile of profiles) {
    counts[profile.archetype] += 1
  }

  const shoppingTrips = profiles.filter((profile) => profile.archetype !== 'gas-stop')
  const biggestHaul = [...shoppingTrips]
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      return b.uniqueItems - a.uniqueItems
    })[0] || null

  const quickestRefill = [...profiles]
    .filter((profile) => profile.archetype === 'quick-refill')
    .sort((a, b) => {
      if (a.total !== b.total) return a.total - b.total
      return a.uniqueItems - b.uniqueItems
    })[0] || null

  const latestStockUp = profiles.find((profile) => profile.archetype === 'stock-up') || null

  return {
    profiles,
    counts,
    averageBasketSpend:
      shoppingTrips.length > 0
        ? roundCurrency(shoppingTrips.reduce((sum, profile) => sum + profile.total, 0) / shoppingTrips.length)
        : 0,
    averageUniqueItems:
      shoppingTrips.length > 0
        ? roundCurrency(shoppingTrips.reduce((sum, profile) => sum + profile.uniqueItems, 0) / shoppingTrips.length)
        : 0,
    biggestHaul,
    quickestRefill,
    latestStockUp,
  }
}
