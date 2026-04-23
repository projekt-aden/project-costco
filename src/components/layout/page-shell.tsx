import type { ReactNode } from 'react'

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between flex-wrap gap-4">
      <div className="space-y-2 max-w-3xl">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">
            {eyebrow}
          </p>
        )}
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm leading-6 text-text-2">{description}</p>
        </div>
      </div>

      {actions && <div className="flex items-center gap-3 flex-wrap">{actions}</div>}
    </div>
  )
}

export function PageSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-text-3">
          {eyebrow}
        </p>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-text-2 max-w-3xl">{description}</p>
      </div>
      {children}
    </section>
  )
}

export function PageActionCard({
  icon,
  title,
  description,
  accentClassName,
  cta = 'Open',
  onClick,
}: {
  icon: ReactNode
  title: string
  description: string
  accentClassName: string
  cta?: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="bg-surface rounded-xl border p-4 text-left hover:border-costco-red/25 hover:shadow-sm transition-all cursor-pointer"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accentClassName}`}>
        {icon}
      </div>
      <p className="text-base font-semibold mt-4">{title}</p>
      <p className="text-sm text-text-2 mt-2 leading-6">{description}</p>
      <span className="inline-flex items-center gap-1.5 text-sm text-costco-blue mt-4 hover:underline">
        {cta}
      </span>
    </button>
  )
}
