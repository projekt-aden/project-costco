import { buildProductHabitCollections, computeSummaryMetrics } from './analytics'
import { computeBasketIntelligence } from './baskets'
import { computeTripBehavior } from './trips'
import type { ProductAggregate } from '../types/product'
import type { Receipt } from '../types/receipt'

export interface DashboardInsight {
  id: string
  title: string
  body: string
  linkLabel?: string
  linkTo?: string
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function buildDashboardInsights(receipts: Receipt[], products: ProductAggregate[]): DashboardInsight[] {
  if (receipts.length === 0) return []

  const summary = computeSummaryMetrics(receipts)
  const habits = buildProductHabitCollections(products)
  const trips = computeTripBehavior(receipts)
  const baskets = computeBasketIntelligence(receipts)

  const insights: DashboardInsight[] = [
    {
      id: 'spend-overview',
      title: 'Your Costco footprint',
      body: `${fmt(summary.totalSpent)} across ${summary.receiptCount} trips, with ${summary.busiestMonth || 'your current peak month'} doing the heaviest lifting.`,
      linkLabel: 'Open receipts',
      linkTo: '/receipts',
    },
  ]

  const topStaple = habits.coreStaples[0]
  if (topStaple) {
    insights.push({
      id: 'core-staple',
      title: 'Strongest repeat habit',
      body: `${topStaple.product.description} looks like a true staple: ${topStaple.product.purchaseMonthsCount} active months and ${topStaple.product.purchaseCount} purchases in this view.`,
      linkLabel: 'View product',
      linkTo: `/analysis/${topStaple.product.itemNumber}`,
    })
  }

  const dominantTrip = Object.entries(trips.counts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])[0]
  if (dominantTrip) {
    const [archetype, count] = dominantTrip
    const labelMap: Record<string, string> = {
      'gas-stop': 'gas stops',
      'quick-refill': 'quick refills',
      'big-haul': 'big hauls',
      'stock-up': 'stock-up runs',
      'mixed-run': 'mixed runs',
    }
    insights.push({
      id: 'trip-pattern',
      title: 'Dominant trip pattern',
      body: `${labelMap[archetype]} lead this year with ${count} trips, and your average shopping basket lands around ${fmt(trips.averageBasketSpend)}.`,
      linkLabel: 'Review patterns',
      linkTo: '/',
    })
  }

  const topPair = baskets.topPairs[0]
  if (topPair) {
    insights.push({
      id: 'basket-pair',
      title: 'Recurring basket combo',
      body: `${topPair.descriptionA} and ${topPair.descriptionB} showed up together on ${topPair.pairCount} trips, which makes them one of your strongest basket pairings.`,
      linkLabel: 'View companion item',
      linkTo: `/analysis/${topPair.itemNumberA}`,
    })
  } else if (baskets.singlePurposeTrips[0]) {
    const trip = baskets.singlePurposeTrips[0]
    insights.push({
      id: 'single-purpose',
      title: 'Focused trip signal',
      body: `${trip.focusDescription} dominated one of your recent runs with ${trip.focusShare}% of the basket, a strong sign of a single-purpose Costco stop.`,
      linkLabel: 'Open receipt',
      linkTo: `/receipts/${trip.receipt.id}`,
    })
  }

  const coolingOff = habits.coolingOff[0]
  if (coolingOff) {
    insights.push({
      id: 'cooling-off',
      title: 'Habit that may be fading',
      body: `${coolingOff.product.description} used to repeat regularly, but it has gone quiet compared with its previous cadence.`,
      linkLabel: 'Inspect history',
      linkTo: `/analysis/${coolingOff.product.itemNumber}`,
    })
  }

  return insights.slice(0, 4)
}
