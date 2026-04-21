import { useState } from 'react'
import { SummaryCards } from '../components/dashboard/summary-cards'
import { ImportButton, DropZone } from '../components/receipt/import-button'
import { useReceipts } from '../hooks/use-receipts'
import { useFilteredReceipts } from '../hooks/use-year-filter'
import { YearPicker } from '../components/ui/year-picker'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, MapPin, Hash } from 'lucide-react'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

const PAGE_SIZE = 5

export function DashboardPage() {
  const allReceipts = useReceipts()
  const receipts = useFilteredReceipts()
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)

  const visible = showAll ? receipts : receipts.slice(0, PAGE_SIZE)
  const hasMore = receipts.length > PAGE_SIZE

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-3">
          <YearPicker />
          {allReceipts.length > 0 && <ImportButton />}
        </div>
      </div>

      {allReceipts.length === 0 ? (
        <DropZone />
      ) : (
        <>
          <SummaryCards />

          <div className="bg-surface rounded-xl border">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold">
                Receipts
                <span className="text-text-3 font-normal ml-1.5">({receipts.length})</span>
              </h3>
              {hasMore && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="text-sm text-costco-blue hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showAll ? 'Show less' : 'Show all'}
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${showAll ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>
            <div>
              {visible.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate(`/receipts/${r.id}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-3 transition-colors border-b last:border-b-0 cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-10 h-10 bg-red-50 text-costco-red rounded-lg flex items-center justify-center">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{r.warehouseName || 'Costco'}</p>
                      <p className="text-xs text-text-3">
                        {new Date(r.transactionDate + 'T00:00:00').toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' '}&middot; {r.items.length} items
                      </p>
                      {r.transactionBarcode && (
                        <p className="text-xs text-text-3 flex items-center gap-1 mt-0.5">
                          <Hash size={10} />
                          {r.transactionBarcode}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-sm">{fmt(r.total)}</span>
                </button>
              ))}
              {receipts.length === 0 && (
                <div className="p-8 text-center text-text-3 text-sm">No receipts for this year</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
