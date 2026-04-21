import { useState, useRef } from 'react'
import {
  Trash2, Download, Upload, AlertTriangle, Check,
  Database, Receipt, Package, Loader2,
  ShieldCheck, HardDrive, Wifi, WifiOff, EyeOff,
  FileDown, BarChart3, ExternalLink, Info,
} from 'lucide-react'
import { db } from '../db'
import { useReceipts } from '../hooks/use-receipts'
import { useLiveQuery } from 'dexie-react-hooks'

export function ProfilePage() {
  const receipts = useReceipts()
  const productCacheCount = useLiveQuery(() => db.productCache.count()) ?? 0
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [status, setStatus] = useState<{ text: string; type: 'success' | 'error' | 'loading' } | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  const totalItems = receipts.reduce((s, r) => s + r.items.length, 0)

  // ─── Export ───

  async function handleExport() {
    setStatus({ text: 'Preparing export...', type: 'loading' })
    try {
      const allReceipts = await db.receipts.toArray()
      const allCache = await db.productCache.toArray()

      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        receipts: allReceipts,
        productCache: allCache,
      }

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `costco-tracker-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)

      setStatus({ text: 'Export downloaded', type: 'success' })
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Export failed', type: 'error' })
    }
  }

  // ─── Import ───

  async function handleImport(file: File) {
    setStatus({ text: 'Importing...', type: 'loading' })
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.receipts && Array.isArray(data.receipts)) {
        // Backup format: { version, receipts, productCache }
        await db.receipts.clear()
        await db.productCache.clear()

        if (data.receipts.length > 0) {
          await db.receipts.bulkAdd(data.receipts)
        }
        if (Array.isArray(data.productCache) && data.productCache.length > 0) {
          await db.productCache.bulkAdd(data.productCache)
        }

        setStatus({ text: `Restored ${data.receipts.length} receipts from backup`, type: 'success' })
      } else if (Array.isArray(data) || (typeof data === 'object' && data.transactionDate)) {
        // Raw Costco API format (array or single receipt) — parse and add
        const { importReceiptsFromJson } = await import('../hooks/use-receipts')
        const count = await importReceiptsFromJson(text)
        setStatus({ text: `Imported ${count} receipts`, type: 'success' })
      } else {
        throw new Error('Unrecognized file format')
      }
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Import failed', type: 'error' })
    }
    if (importRef.current) importRef.current.value = ''
  }

  // ─── Delete all ───

  async function handleDeleteAll() {
    setStatus({ text: 'Deleting...', type: 'loading' })
    try {
      await db.receipts.clear()
      await db.productCache.clear()
      localStorage.removeItem('costco-year-filter')
      setConfirmDelete(false)
      setStatus({ text: 'All data deleted', type: 'success' })
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : 'Delete failed', type: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Profile & Data</h2>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700' :
          status.type === 'error' ? 'bg-red-50 text-danger' :
          'bg-blue-50 text-costco-blue'
        }`}>
          {status.type === 'loading' && <Loader2 size={16} className="animate-spin" />}
          {status.type === 'success' && <Check size={16} />}
          {status.type === 'error' && <AlertTriangle size={16} />}
          {status.text}
        </div>
      )}

      {/* Stats */}
      <div className="bg-surface rounded-xl border p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Database size={16} className="text-costco-red" />
          Storage
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <StatBox icon={<Receipt size={16} />} label="Receipts" value={receipts.length} />
          <StatBox icon={<Package size={16} />} label="Items" value={totalItems} />
          <StatBox icon={<Database size={16} />} label="Cached products" value={productCacheCount} />
        </div>
      </div>

      {/* Export */}
      <div className="bg-surface rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Download size={16} className="text-costco-blue" />
          Export Data
        </h3>
        <p className="text-sm text-text-2">
          Download all receipts and cached product data as a JSON file. Use this to back up your data or transfer it to another device.
        </p>
        <button
          onClick={handleExport}
          disabled={receipts.length === 0 || status?.type === 'loading'}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-costco-blue text-white rounded-xl text-sm font-medium hover:bg-costco-blue/90 transition-colors cursor-pointer disabled:opacity-60"
        >
          <Download size={16} />
          Export JSON
        </button>
      </div>

      {/* Import */}
      <div className="bg-surface rounded-xl border p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Upload size={16} className="text-costco-blue" />
          Import Data
        </h3>
        <p className="text-sm text-text-2">
          Restore from a previously exported JSON file. This will replace all current data.
        </p>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleImport(file)
          }}
        />
        <button
          onClick={() => importRef.current?.click()}
          disabled={status?.type === 'loading'}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-costco-blue text-white rounded-xl text-sm font-medium hover:bg-costco-blue/90 transition-colors cursor-pointer disabled:opacity-60"
        >
          <Upload size={16} />
          Import JSON
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-surface rounded-xl border border-danger/20 p-5 space-y-3">
        <h3 className="font-semibold text-danger flex items-center gap-2">
          <Trash2 size={16} />
          Danger Zone
        </h3>
        <p className="text-sm text-text-2">
          Permanently delete all receipts and cached data. This cannot be undone.
        </p>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={receipts.length === 0 && productCacheCount === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-danger text-white rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors cursor-pointer disabled:opacity-60"
          >
            <Trash2 size={16} />
            Delete All Data
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDeleteAll}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-danger text-white rounded-xl text-sm font-medium hover:bg-danger/90 transition-colors cursor-pointer"
            >
              <AlertTriangle size={16} />
              Yes, delete everything
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-4 py-2.5 text-sm text-text-2 hover:text-text transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ─── About ─── */}
      <div className="bg-surface rounded-xl border p-5 space-y-5">
        <h3 className="font-semibold flex items-center gap-2">
          <Info size={16} className="text-costco-blue" />
          About Costco Tracker
        </h3>

        <p className="text-sm text-text-2">
          A privacy-first receipt tracker for Costco members.
          Import your receipts and get instant insights into spending, price trends, and purchase history.
        </p>

        {/* Privacy guarantees */}
        <div className="bg-emerald-50 rounded-xl p-4 space-y-3">
          <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
            <ShieldCheck size={16} />
            Your data is 100% private
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <PrivacyItem icon={<WifiOff size={14} />} text="No server, no API calls" />
            <PrivacyItem icon={<EyeOff size={14} />} text="No tracking or analytics" />
            <PrivacyItem icon={<HardDrive size={14} />} text="Data stored only on your device" />
            <PrivacyItem icon={<ShieldCheck size={14} />} text="No accounts or sign-ups" />
          </div>
        </div>

        {/* How it works — data flow */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">How it works</h4>
          <div className="flex flex-col gap-2">
            <FlowStep
              step={1}
              icon={<FileDown size={16} />}
              title="Import"
              description="Drop your Costco receipt files (JSON or PDF)"
            />
            <FlowArrow />
            <FlowStep
              step={2}
              icon={<HardDrive size={16} />}
              title="Store locally"
              description="Receipts are parsed and saved to your browser's IndexedDB"
            />
            <FlowArrow />
            <FlowStep
              step={3}
              icon={<BarChart3 size={16} />}
              title="Analyze"
              description="Dashboard, trends, and product insights — all computed in the browser"
            />
          </div>

          <div className="flex items-center gap-2 bg-surface-2 rounded-lg px-3 py-2 mt-2">
            <Wifi size={14} className="text-text-3" />
            <p className="text-xs text-text-3">
              After the page loads, no network requests are made. Everything runs offline.
            </p>
          </div>
        </div>

        {/* Open source */}
        <div className="border-t pt-4 flex items-center justify-between">
          <div className="text-xs text-text-3">
            Open source under MIT license
          </div>
          <a
            href="https://github.com/projekt-aden/project-costco"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1.5 text-xs text-costco-blue hover:underline"
          >
            <ExternalLink size={14} />
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  )
}

function PrivacyItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-emerald-700">
      {icon}
      <span className="text-xs">{text}</span>
    </div>
  )
}

function FlowStep({ step, icon, title, description }: {
  step: number; icon: React.ReactNode; title: string; description: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 bg-costco-red text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
        {step}
      </div>
      <div className="flex items-start gap-2 flex-1 min-w-0">
        <div className="w-8 h-8 bg-surface-2 rounded-lg flex items-center justify-center text-text-2 shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-text-3">{description}</p>
        </div>
      </div>
    </div>
  )
}

function FlowArrow() {
  return (
    <div className="flex items-center pl-3">
      <div className="w-0.5 h-3 bg-border ml-[13px]" />
    </div>
  )
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-surface-2 rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-text-3 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-lg font-bold">{value.toLocaleString()}</p>
    </div>
  )
}
