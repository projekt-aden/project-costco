import { Repeat, Sparkles, Snowflake } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useProductHabitInsights } from '../../hooks/use-products'

function fmtDays(days: number | null) {
  if (days === null) return 'Cadence forming'
  return `~${Math.round(days)} day rhythm`
}

export function HabitInsights() {
  const navigate = useNavigate()
  const { coreStaples, emergingStaples, coolingOff } = useProductHabitInsights()

  const sections = [
    {
      title: 'Core Staples',
      icon: <Repeat size={16} />,
      accent: 'text-costco-blue',
      bg: 'bg-blue-50',
      items: coreStaples,
      empty: 'Your strongest repeats will show up here once products appear across several months.',
    },
    {
      title: 'Emerging',
      icon: <Sparkles size={16} />,
      accent: 'text-emerald-600',
      bg: 'bg-emerald-50',
      items: emergingStaples,
      empty: 'New repeat patterns will appear here as recent purchases start recurring.',
    },
    {
      title: 'Cooling Off',
      icon: <Snowflake size={16} />,
      accent: 'text-amber-700',
      bg: 'bg-amber-50',
      items: coolingOff,
      empty: 'Products that used to repeat but have gone quiet will show up here.',
    },
  ]

  if (sections.every((section) => section.items.length === 0)) {
    return null
  }

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-semibold">Habit Signals</h3>
        <p className="text-sm text-text-3 mt-1">
          A read on what has become a staple, what is forming, and what may be fading.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {sections.map((section) => (
          <div key={section.title} className="bg-surface rounded-xl border overflow-hidden">
            <div className="flex items-center gap-2 border-b p-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${section.bg} ${section.accent}`}>
                {section.icon}
              </div>
              <h4 className="font-semibold">{section.title}</h4>
            </div>

            <div className="p-3 space-y-3">
              {section.items.length === 0 ? (
                <p className="text-sm text-text-3">{section.empty}</p>
              ) : (
                section.items.map((insight) => (
                  <button
                    key={`${section.title}-${insight.product.itemNumber}`}
                    onClick={() => navigate(`/analysis/${insight.product.itemNumber}`)}
                    className="w-full rounded-xl border bg-surface-2 p-3 text-left hover:border-costco-red/25 hover:bg-surface transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium line-clamp-2">{insight.product.description}</p>
                    <p className="text-xs text-text-3 mt-0.5">#{insight.product.itemNumber}</p>
                    <p className="text-xs mt-2 text-text-2">{insight.description}</p>
                    <p className="text-xs text-text-3 mt-1">
                      {insight.product.purchaseMonthsCount} months active · {fmtDays(insight.product.averageDaysBetweenPurchases)}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
