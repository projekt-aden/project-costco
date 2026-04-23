import { useMemo, useState, type ReactNode } from 'react'
import { Search, Package, ReceiptText, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFilteredReceipts } from '../../hooks/use-year-filter'
import { useProductAggregates } from '../../hooks/use-products'
import { searchProducts, searchReceipts } from '../../lib/analytics'

const MAX_RESULTS = 4

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function QuickFind() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const receipts = useFilteredReceipts()
  const products = useProductAggregates()

  const productResults = useMemo(
    () => searchProducts(products, query).slice(0, MAX_RESULTS),
    [products, query],
  )
  const receiptResults = useMemo(
    () => searchReceipts(receipts, query).slice(0, MAX_RESULTS),
    [receipts, query],
  )
  const hasQuery = query.trim().length > 0

  return (
    <section className="bg-surface rounded-xl border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Quick Find</h3>
        <p className="text-sm text-text-3 mt-1">
          Search by product, item number, warehouse, barcode, or date.
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try eggs, 123456, Seattle, or 2025-03"
            className="w-full pl-9 pr-4 py-2.5 bg-surface border rounded-xl text-sm outline-none focus:border-costco-red/40 transition-colors"
          />
        </div>

        {!hasQuery ? (
          <p className="text-sm text-text-3">
            Start typing to jump straight to products and receipts in the current year filter.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <ResultColumn
              title={`Products (${productResults.length})`}
              icon={<Package size={16} />}
              emptyLabel="No matching products"
              items={productResults.map((result) => (
                <button
                  key={result.product.itemNumber}
                  onClick={() => navigate(`/analysis/${result.product.itemNumber}`)}
                  className="w-full rounded-xl border bg-surface-2 p-3 text-left hover:border-costco-red/25 hover:bg-surface transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{result.product.description}</p>
                      <p className="text-xs text-text-3 mt-0.5">#{result.product.itemNumber}</p>
                      <p className="text-xs text-text-3 mt-1">
                        {result.product.purchaseCount}x bought
                        {result.product.averageDaysBetweenPurchases !== null
                          ? ` · every ~${Math.round(result.product.averageDaysBetweenPurchases)} days`
                          : ''}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-text-3 shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            />

            <ResultColumn
              title={`Receipts (${receiptResults.length})`}
              icon={<ReceiptText size={16} />}
              emptyLabel="No matching receipts"
              items={receiptResults.map((result) => (
                <button
                  key={result.receipt.id}
                  onClick={() => navigate(`/receipts/${result.receipt.id}`)}
                  className="w-full rounded-xl border bg-surface-2 p-3 text-left hover:border-costco-red/25 hover:bg-surface transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {result.receipt.warehouseName || 'Costco'}
                      </p>
                      <p className="text-xs text-text-3 mt-0.5">
                        {result.receipt.transactionDate}
                        {result.receipt.transactionBarcode
                          ? ` · #${result.receipt.transactionBarcode}`
                          : ''}
                      </p>
                      <p className="text-xs text-text-3 mt-1">
                        {result.receipt.items.length} items · {fmt(result.receipt.total)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-text-3 shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            />
          </div>
        )}
      </div>
    </section>
  )
}

function ResultColumn({
  title,
  icon,
  emptyLabel,
  items,
}: {
  title: string
  icon: ReactNode
  emptyLabel: string
  items: ReactNode[]
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {title}
      </div>
      {items.length > 0 ? items : <p className="text-sm text-text-3">{emptyLabel}</p>}
    </div>
  )
}
