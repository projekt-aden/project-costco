import { Compass, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFilteredReceipts } from '../../hooks/use-year-filter'
import { useProductAggregates } from '../../hooks/use-products'
import { buildDashboardInsights } from '../../lib/insights'

export function InsightSummary() {
  const navigate = useNavigate()
  const receipts = useFilteredReceipts()
  const products = useProductAggregates()
  const insights = buildDashboardInsights(receipts, products)

  if (insights.length === 0) return null

  return (
    <section className="bg-surface rounded-xl border overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-costco-blue/10 text-costco-blue">
          <Compass size={16} />
        </div>
        <div>
          <h3 className="font-semibold">What Stands Out</h3>
          <p className="text-sm text-text-3">A concise read on the strongest signals in your Costco data.</p>
        </div>
      </div>

      <div className="grid gap-px bg-border xl:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.id} className="bg-surface p-4">
            <p className="text-sm font-semibold">{insight.title}</p>
            <p className="text-sm text-text-2 mt-2 leading-6">{insight.body}</p>
            {insight.linkTo && insight.linkLabel && (
              <button
                onClick={() => navigate(insight.linkTo!)}
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-costco-blue hover:underline cursor-pointer"
              >
                {insight.linkLabel}
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
