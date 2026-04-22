import { PlayCircle, RotateCcw, Sparkles } from 'lucide-react'

export function DemoModeBanner({
  onStartFresh,
  busy = false,
}: {
  onStartFresh: () => void
  busy?: boolean
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(135deg,rgba(251,191,36,0.18),rgba(255,255,255,0.95))] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <Sparkles size={20} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">You are viewing demo data</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Demo mode
              </span>
            </div>
            <p className="text-sm text-text-2 max-w-2xl">
              Explore the app with sample Costco receipts first. When you are ready, start fresh and import your own receipts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartFresh}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-costco-red px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-costco-red/90 disabled:opacity-60 cursor-pointer"
        >
          <RotateCcw size={16} />
          Use my receipts
        </button>
      </div>
    </div>
  )
}

export function EmptyDemoOnboarding({
  onTryDemo,
  onImportOwn,
  busy = false,
}: {
  onTryDemo: () => void
  onImportOwn: () => void
  busy?: boolean
}) {
  return (
    <section className="rounded-3xl border bg-[linear-gradient(145deg,rgba(227,24,54,0.06),rgba(30,64,175,0.04),rgba(255,255,255,1))] p-6 md:p-8 space-y-6">
      <div className="space-y-2 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-costco-red">New here?</p>
        <h3 className="text-2xl font-semibold tracking-tight">See the app with demo data before importing your own receipts</h3>
        <p className="text-sm leading-6 text-text-2">
          You can take a quick tour with sample Costco receipts, then wipe the demo and start with your own data whenever you are ready.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          onClick={onTryDemo}
          disabled={busy}
          className="rounded-2xl border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-costco-red/30 hover:shadow-md disabled:opacity-60 cursor-pointer"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <PlayCircle size={22} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">Try Demo</h4>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                Recommended first step
              </span>
            </div>
            <p className="text-sm text-text-2">
              Load sample receipts and see how dashboard, trends, products, and receipt details work.
            </p>
            <div className="space-y-2 pt-1 text-sm text-text-2">
              <p>Includes realistic sample receipts.</p>
              <p>You can remove everything later with one click.</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={onImportOwn}
          disabled={busy}
          className="rounded-2xl border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-costco-blue/30 hover:shadow-md disabled:opacity-60 cursor-pointer"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-costco-blue/10 text-costco-blue">
            <RotateCcw size={22} />
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Import My Receipts</h4>
            <p className="text-sm text-text-2">
              Skip the demo and go straight to the import instructions for your Costco receipts.
            </p>
            <div className="space-y-2 pt-1 text-sm text-text-2">
              <p>Use PDF import for the easiest path.</p>
              <p>Use JSON export if you want to backfill lots of history at once.</p>
            </div>
          </div>
        </button>
      </div>
    </section>
  )
}
