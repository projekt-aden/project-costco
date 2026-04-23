import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Fuel, TrendingDown, TrendingUp, DollarSign, Droplets } from 'lucide-react'
import { useFilteredReceipts } from '../hooks/use-year-filter'
import { YearPicker } from '../components/ui/year-picker'
import { PriceChart } from '../components/analysis/price-chart'
import { PageIntro, PageSection } from '../components/layout/page-shell'
import type { Receipt } from '../types/receipt'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmtGal(n: number): string {
  return n.toFixed(2)
}

function fmtPpg(n: number): string {
  return '$' + n.toFixed(3)
}

interface FuelFillUp {
  date: string
  grade: string
  gallons: number
  pricePerGallon: number
  total: number
  warehouse: string
  receiptId: string
}

function extractFuelData(receipts: Receipt[]): FuelFillUp[] {
  const fills: FuelFillUp[] = []

  for (const r of receipts) {
    for (const item of r.items) {
      if (typeof item.fuelGallons === 'number' && item.fuelGallons > 0 && item.fuelPricePerGallon && item.fuelPricePerGallon > 0) {
        fills.push({
          date: r.transactionDate,
          grade: item.fuelGrade || item.description || 'Gas',
          gallons: item.fuelGallons,
          pricePerGallon: item.fuelPricePerGallon || (item.amount / item.fuelGallons),
          total: item.amount,
          warehouse: r.warehouseName,
          receiptId: r.id,
        })
      }
    }
  }

  fills.sort((a, b) => b.date.localeCompare(a.date))
  return fills
}

export function GasPage() {
  const receipts = useFilteredReceipts()
  const navigate = useNavigate()

  const fills = useMemo(() => extractFuelData(receipts), [receipts])

  const stats = useMemo(() => {
    if (fills.length === 0) return null
    const totalGallons = fills.reduce((s, f) => s + f.gallons, 0)
    const totalSpent = fills.reduce((s, f) => s + f.total, 0)
    const prices = fills.map((f) => f.pricePerGallon)
    const avgPpg = totalSpent / totalGallons
    const minPpg = Math.min(...prices)
    const maxPpg = Math.max(...prices)
    return { totalGallons, totalSpent, avgPpg, minPpg, maxPpg, fillCount: fills.length }
  }, [fills])

  const pricePoints = useMemo(
    () => [...fills].reverse().map((f) => ({ date: f.date, unitPrice: f.pricePerGallon })),
    [fills],
  )

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Fuel"
        title="Gas"
        description="Track how much you spend on fuel, how your per-gallon price moves over time, and what each fill-up looked like."
        actions={<YearPicker />}
      />

      {fills.length === 0 ? (
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <Fuel size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium mb-1">No fuel purchases</p>
          <p className="text-sm">Import fuel receipts or sync from Costco to see gas data</p>
        </div>
      ) : (
        <>
          {stats && (
            <PageSection
              eyebrow="Snapshot"
              title="How your fuel year is trending"
              description="Use this layer for the fastest read on total fuel spend, total volume, and the best versus average price you saw."
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={<DollarSign size={18} />}
                  label="Total Spent"
                  value={fmt(stats.totalSpent)}
                  color="text-costco-red"
                  bg="bg-red-50"
                />
                <StatCard
                  icon={<Droplets size={18} />}
                  label="Total Gallons"
                  value={fmtGal(stats.totalGallons)}
                  sub={`${stats.fillCount} fill-ups`}
                  color="text-costco-blue"
                  bg="bg-blue-50"
                />
                <StatCard
                  icon={<TrendingDown size={18} />}
                  label="Best Price"
                  value={fmtPpg(stats.minPpg) + '/gal'}
                  color="text-emerald-600"
                  bg="bg-emerald-50"
                />
                <StatCard
                  icon={<TrendingUp size={18} />}
                  label="Avg Price"
                  value={fmtPpg(stats.avgPpg) + '/gal'}
                  sub={`High: ${fmtPpg(stats.maxPpg)}`}
                  color="text-amber-600"
                  bg="bg-amber-50"
                />
              </div>
            </PageSection>
          )}

          {pricePoints.length > 1 && (
            <PageSection
              eyebrow="Trend"
              title="Price movement across fill-ups"
              description="This chart shows how your per-gallon cost evolved through the year so you can spot lower windows and more expensive stretches."
            >
              <PriceChart prices={pricePoints} />
            </PageSection>
          )}

          <PageSection
            eyebrow="History"
            title="Fill-up history"
            description="Open any fill-up to jump back to the original receipt and inspect the exact station visit."
          >
            <div className="bg-surface rounded-xl border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Fill-up History ({fills.length})</h3>
              </div>
              <div className="divide-y">
                {fills.map((f, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/receipts/${f.receiptId}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                        <Fuel size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{f.grade}</p>
                        <p className="text-xs text-text-3">
                          {new Date(f.date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-text-3">{f.warehouse || 'Costco'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{fmt(f.total)}</p>
                      <p className="text-xs text-emerald-600 font-medium tabular-nums">
                        {fmtGal(f.gallons)} gal
                      </p>
                      <p className="text-xs text-text-3 tabular-nums">
                        {fmtPpg(f.pricePerGallon)}/gal
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </PageSection>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, sub, color, bg }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string; bg: string
}) {
  return (
    <div className="bg-surface rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 ${bg} ${color} rounded-lg flex items-center justify-center`}>{icon}</div>
        <span className="text-sm text-text-2">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-text-3 mt-0.5">{sub}</p>}
    </div>
  )
}
