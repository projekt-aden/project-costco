import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface InsightPathwayItem {
  title: string
  description: string
  to: string
  cta: string
  icon: ReactNode
  accentClassName: string
}

export function InsightPathways({
  title,
  description,
  items,
}: {
  title: string
  description: string
  items: InsightPathwayItem[]
}) {
  const navigate = useNavigate()

  if (items.length === 0) return null

  return (
    <section className="bg-surface rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-text-3 mt-1">{description}</p>
      </div>

      <div className="grid gap-px bg-border xl:grid-cols-3">
        {items.map((item) => (
          <button
            key={`${item.title}-${item.to}`}
            onClick={() => navigate(item.to)}
            className="bg-surface p-4 text-left hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.accentClassName}`}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-sm text-text-2 mt-1 leading-6">{item.description}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm text-costco-blue hover:underline">
                  {item.cta}
                  <ArrowRight size={14} />
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
