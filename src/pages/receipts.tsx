import { ImportButton } from '../components/receipt/import-button'
import { Timeline } from '../components/receipt/timeline'
import { clearAllData, useReceipts } from '../hooks/use-receipts'
import { normalizeSearchText, searchReceipts } from '../lib/analytics'
import { Trash2, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

export function ReceiptsPage() {
  const receipts = useReceipts()
  const [confirmClear, setConfirmClear] = useState(false)
  const [query, setQuery] = useState('')
  const normalizedQuery = normalizeSearchText(query)
  const filteredReceipts = useMemo(() => {
    if (!normalizedQuery) return receipts
    return searchReceipts(receipts, normalizedQuery).map((match) => match.receipt)
  }, [normalizedQuery, receipts])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold">Receipts</h2>
        <div className="flex items-center gap-3">
          {receipts.length > 0 && (
            <>
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-danger">Delete all data?</span>
                  <button
                    onClick={() => {
                      clearAllData()
                      setConfirmClear(false)
                    }}
                    className="px-3 py-1.5 bg-danger text-white rounded-lg text-sm font-medium cursor-pointer"
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="px-3 py-1.5 bg-surface-3 rounded-lg text-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-text-3 hover:text-danger transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                  Clear all
                </button>
              )}
            </>
          )}
          <ImportButton />
        </div>
      </div>

      {receipts.length > 0 && (
        <div className="bg-surface rounded-xl border p-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search receipts by item, item #, warehouse, barcode, or date"
              className="w-full pl-9 pr-4 py-2.5 bg-surface border rounded-xl text-sm outline-none focus:border-costco-red/40 transition-colors"
            />
          </div>
          {normalizedQuery && (
            <p className="text-sm text-text-3 mt-3">
              {filteredReceipts.length} matching receipt{filteredReceipts.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      )}

      {normalizedQuery && filteredReceipts.length === 0 ? (
        <div className="bg-surface rounded-xl border p-8 text-center text-text-3">
          <p className="text-lg font-medium mb-1">No matching receipts</p>
          <p className="text-sm">Try a product name, item number, warehouse, or barcode.</p>
        </div>
      ) : (
        <Timeline receipts={filteredReceipts} />
      )}
    </div>
  )
}
