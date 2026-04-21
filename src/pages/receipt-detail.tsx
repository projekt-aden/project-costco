import { useParams, useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { deleteReceipt, deleteReceiptItem } from '../hooks/use-receipts'
import { ArrowLeft, Trash2, MapPin, Calendar, Hash } from 'lucide-react'
import { useState } from 'react'

function fmt(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const receipt = useLiveQuery(() => (id ? db.receipts.get(id) : undefined), [id])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletingItem, setDeletingItem] = useState<string | null>(null)

  if (receipt === undefined) {
    return (
      <div className="text-center py-16 text-text-3">
        <p>Loading...</p>
      </div>
    )
  }

  if (receipt === null || !receipt) {
    return (
      <div className="text-center py-16">
        <p className="text-text-3 mb-4">Receipt not found</p>
        <button
          onClick={() => navigate('/receipts')}
          className="text-costco-blue hover:underline cursor-pointer"
        >
          Back to receipts
        </button>
      </div>
    )
  }

  const dateLabel = new Date(receipt.transactionDate + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-3 transition-colors cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{receipt.warehouseName || 'Costco'}</h2>
          <p className="text-sm text-text-2">{dateLabel}</p>
        </div>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await deleteReceipt(receipt.id)
                navigate('/receipts')
              }}
              className="px-3 py-1.5 bg-danger text-white rounded-lg text-sm font-medium cursor-pointer"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1.5 bg-surface-3 rounded-lg text-sm cursor-pointer"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 text-text-3 hover:text-danger transition-colors cursor-pointer"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface rounded-xl border p-3 flex items-center gap-2">
          <MapPin size={16} className="text-text-3" />
          <div>
            <p className="text-xs text-text-3">Warehouse</p>
            <p className="text-sm font-medium">{receipt.warehouseName || '—'}</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border p-3 flex items-center gap-2">
          <Calendar size={16} className="text-text-3" />
          <div>
            <p className="text-xs text-text-3">Date</p>
            <p className="text-sm font-medium">{receipt.transactionDate}</p>
          </div>
        </div>
        <div className="bg-surface rounded-xl border p-3 flex items-center gap-2">
          <Hash size={16} className="text-text-3" />
          <div>
            <p className="text-xs text-text-3">Barcode</p>
            <p className="text-sm font-medium truncate">{receipt.transactionBarcode || '—'}</p>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-surface rounded-xl border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Items ({receipt.items.length})</h3>
        </div>
        <div className="divide-y">
          {receipt.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-4 hover:bg-surface-3 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.description}</p>
                {item.description2 && (
                  <p className="text-xs text-text-3">{item.description2}</p>
                )}
                <p className="text-xs text-text-3 mt-0.5">
                  #{item.itemNumber}
                  {item.quantity > 1 && ` · qty ${item.quantity}`}
                  {item.taxFlag && ` · tax: ${item.taxFlag}`}
                </p>
              </div>
              <span className="font-semibold text-sm tabular-nums">{fmt(item.amount)}</span>
              {deletingItem === item.id ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      await deleteReceiptItem(receipt.id, item.id)
                      setDeletingItem(null)
                    }}
                    className="px-2 py-1 bg-danger text-white rounded text-xs cursor-pointer"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeletingItem(null)}
                    className="px-2 py-1 bg-surface-3 rounded text-xs cursor-pointer"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeletingItem(item.id)}
                  className="p-1 text-text-3 hover:text-danger opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coupons */}
      {receipt.coupons.length > 0 && (
        <div className="bg-surface rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Coupons ({receipt.coupons.length})</h3>
          </div>
          <div className="divide-y">
            {receipt.coupons.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <span className="text-sm">{c.description || `Coupon #${c.itemNumber || i + 1}`}</span>
                <span className="text-sm font-medium text-success">{fmt(c.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-surface rounded-xl border p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-2">Subtotal</span>
          <span>{fmt(receipt.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-2">Tax</span>
          <span>{fmt(receipt.tax)}</span>
        </div>
        <div className="flex justify-between text-base font-bold border-t pt-2">
          <span>Total</span>
          <span>{fmt(receipt.total)}</span>
        </div>
      </div>
    </div>
  )
}
