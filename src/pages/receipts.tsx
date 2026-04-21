import { ImportButton } from '../components/receipt/import-button'
import { Timeline } from '../components/receipt/timeline'
import { clearAllData, useReceipts } from '../hooks/use-receipts'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export function ReceiptsPage() {
  const receipts = useReceipts()
  const [confirmClear, setConfirmClear] = useState(false)

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

      <Timeline />
    </div>
  )
}
