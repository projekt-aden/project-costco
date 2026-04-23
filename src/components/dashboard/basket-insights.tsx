import { Link2, Target, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFilteredReceipts } from '../../hooks/use-year-filter'
import { computeBasketIntelligence } from '../../lib/baskets'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function BasketInsights() {
  const receipts = useFilteredReceipts()
  const navigate = useNavigate()
  const intelligence = computeBasketIntelligence(receipts)

  if (intelligence.topPairs.length === 0 && intelligence.singlePurposeTrips.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold">Basket Intelligence</h3>
        <p className="text-sm text-text-3 mt-1">
          See which products repeatedly show up together and which trips look laser-focused on one thing.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="bg-surface rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-costco-blue">
              <Link2 size={16} />
            </div>
            <h4 className="font-semibold">Often Bought Together</h4>
          </div>
          <div className="divide-y">
            {intelligence.topPairs.map((pair) => (
              <button
                key={`${pair.itemNumberA}-${pair.itemNumberB}`}
                onClick={() => navigate(`/analysis/${pair.itemNumberA}`)}
                className="w-full p-3 text-left hover:bg-surface-3 transition-colors cursor-pointer"
              >
                <p className="text-sm font-medium">
                  {pair.descriptionA} + {pair.descriptionB}
                </p>
                <p className="text-xs text-text-3 mt-0.5">
                  {pair.pairCount} trips together · #{pair.itemNumberA} / #{pair.itemNumberB}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 text-amber-700">
              <Target size={16} />
            </div>
            <h4 className="font-semibold">Single-Purpose Runs</h4>
          </div>
          <div className="p-3 space-y-3">
            {intelligence.singlePurposeTrips.map((trip) => (
              <button
                key={trip.receipt.id}
                onClick={() => navigate(`/receipts/${trip.receipt.id}`)}
                className="w-full rounded-xl border bg-surface-2 p-3 text-left hover:border-costco-red/25 hover:bg-surface transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{trip.focusDescription}</p>
                    <p className="text-xs text-text-3 mt-0.5">
                      {trip.focusShare}% of spend · {trip.receipt.items.length} items
                    </p>
                    <p className="text-xs text-text-3 mt-1">
                      {trip.receipt.transactionDate} · {trip.receipt.warehouseName || 'Costco'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">{fmt(trip.receipt.total)}</p>
                    <ArrowRight size={14} className="text-text-3 ml-auto mt-2" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
