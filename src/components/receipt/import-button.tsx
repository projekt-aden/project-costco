/* eslint-disable react-refresh/only-export-components */

import { useRef, useState, useEffect, useSyncExternalStore } from 'react'
import { Upload, FileUp, Check, AlertCircle, Copy, X, Loader2 } from 'lucide-react'
import { importReceiptsFromJson, importReceiptsFromPdf } from '../../hooks/use-receipts'

// ─── Types ───

interface FileResult {
  name: string
  imported: number
  skipped: number
  error?: string
}

interface ImportProgress {
  totalFiles: number
  doneFiles: number
  currentFile: string
  results: FileResult[]
}

interface ImportReport {
  files: FileResult[]
  totalImported: number
  totalSkipped: number
  totalErrors: number
}

type ToastState =
  | { type: 'progress'; progress: ImportProgress }
  | { type: 'done'; report: ImportReport }

// ─── Global toast state (survives component unmount/remount) ───

let toastState: ToastState | null = null
const toastListeners = new Set<() => void>()

function setToast(t: ToastState | null) {
  toastState = t
  toastListeners.forEach((cb) => cb())
}

function getToast() { return toastState }
function subscribeToast(cb: () => void) {
  toastListeners.add(cb)
  return () => toastListeners.delete(cb)
}

function useToast() {
  return useSyncExternalStore(subscribeToast, getToast, () => null)
}

// ─── Processing ───

function summarize(results: FileResult[]): ImportReport {
  return {
    files: results,
    totalImported: results.reduce((s, r) => s + r.imported, 0),
    totalSkipped: results.reduce((s, r) => s + r.skipped, 0),
    totalErrors: results.filter((r) => r.error).length,
  }
}

async function processFiles(files: FileList | File[]) {
  const results: FileResult[] = []
  const total = files.length

  for (let i = 0; i < total; i++) {
    const file = files[i]
    setToast({ type: 'progress', progress: { totalFiles: total, doneFiles: i, currentFile: file.name, results: [...results] } })

    try {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf'

      if (isPdf) {
        const buffer = await file.arrayBuffer()
        const count = await importReceiptsFromPdf(buffer)
        results.push({ name: file.name, imported: count, skipped: count === 0 ? 1 : 0 })
      } else {
        const text = await file.text()
        const parsed = JSON.parse(text)
        const totalInFile = Array.isArray(parsed) ? parsed.length : 1
        const count = await importReceiptsFromJson(text)
        results.push({ name: file.name, imported: count, skipped: totalInFile - count })
      }
    } catch (e) {
      results.push({ name: file.name, imported: 0, skipped: 0, error: e instanceof Error ? e.message : 'Invalid file' })
    }
  }

  setToast({ type: 'done', report: summarize(results) })
}

let importing = false

export async function startImport(files: FileList | File[]) {
  if (importing || !files || files.length === 0) return
  importing = true
  await processFiles(files)
  importing = false
}

// ─── Components ───

/** Compact button for header — also shows full-page drop overlay */
export function ImportButton() {
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [draggingOver, setDraggingOver] = useState(false)
  const dragCounter = useRef(0)
  const isLoading = toast?.type === 'progress'

  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      e.preventDefault()
      dragCounter.current++
      if (e.dataTransfer?.types.includes('Files')) setDraggingOver(true)
    }
    function onDragLeave(e: DragEvent) {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current === 0) setDraggingOver(false)
    }
    function onDragOver(e: DragEvent) { e.preventDefault() }
    function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = 0
      setDraggingOver(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        startImport(e.dataTransfer.files)
      }
    }

    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [])

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-costco-red text-white rounded-xl text-sm font-medium hover:bg-costco-red/90 transition-colors cursor-pointer disabled:opacity-60"
        >
          <Upload size={16} />
          {isLoading ? 'Importing...' : 'Import'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) startImport(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      <ImportToastPortal />

      {draggingOver && (
        <div className="fixed inset-0 z-50 bg-costco-red/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-surface rounded-2xl border-2 border-dashed border-costco-red p-12 text-center shadow-xl">
            <FileUp size={48} className="mx-auto mb-4 text-costco-red" />
            <p className="text-lg font-semibold">Drop receipts here</p>
            <p className="text-sm text-text-2 mt-1">PDF or JSON files</p>
          </div>
        </div>
      )}
    </>
  )
}

/** Large drop zone for empty state */
export function DropZone() {
  const inputRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [dragActive, setDragActive] = useState(false)
  const dragCounter = useRef(0)
  const isLoading = toast?.type === 'progress'

  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      e.preventDefault()
      dragCounter.current++
      if (e.dataTransfer?.types.includes('Files')) setDragActive(true)
    }
    function onDragLeave(e: DragEvent) {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current === 0) setDragActive(false)
    }
    function onDragOver(e: DragEvent) { e.preventDefault() }
    function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = 0
      setDragActive(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        startImport(e.dataTransfer.files)
      }
    }

    document.addEventListener('dragenter', onDragEnter)
    document.addEventListener('dragleave', onDragLeave)
    document.addEventListener('dragover', onDragOver)
    document.addEventListener('drop', onDrop)
    return () => {
      document.removeEventListener('dragenter', onDragEnter)
      document.removeEventListener('dragleave', onDragLeave)
      document.removeEventListener('dragover', onDragOver)
      document.removeEventListener('drop', onDrop)
    }
  }, [])

  return (
    <>
      <div
        onClick={() => inputRef.current?.click()}
        className={`relative bg-surface rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          dragActive
            ? 'border-costco-red bg-red-50 scale-[1.01]'
            : 'border-border hover:border-costco-red/40 hover:bg-surface-3'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) startImport(e.target.files)
            e.target.value = ''
          }}
        />

        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors ${
          dragActive ? 'bg-costco-red/10 text-costco-red' : 'bg-red-50 text-costco-red'
        }`}>
          <FileUp size={28} />
        </div>

        <h3 className="text-lg font-semibold mb-1">
          {dragActive ? 'Drop to import' : 'Drop receipts here'}
        </h3>
        <p className="text-text-2 text-sm mb-4">or click to browse files</p>
        <p className="text-xs text-text-3">Supports PDF and JSON from costco.com</p>

        {isLoading && <p className="text-sm text-costco-blue mt-4">Importing...</p>}
      </div>

      <ImportToastPortal />

      {dragActive && (
        <div className="fixed inset-0 z-50 bg-costco-red/10 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-surface rounded-2xl border-2 border-dashed border-costco-red p-12 text-center shadow-xl">
            <FileUp size={48} className="mx-auto mb-4 text-costco-red" />
            <p className="text-lg font-semibold">Drop receipts here</p>
            <p className="text-sm text-text-2 mt-1">PDF or JSON files</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Toast (reads from global state — survives component remounts) ───

function ImportToastPortal() {
  const toast = useToast()
  if (!toast) return null
  if (toast.type === 'progress') return <ProgressToast progress={toast.progress} />
  return <ReportToast report={toast.report} />
}

function ProgressToast({ progress }: { progress: ImportProgress }) {
  const { totalFiles, doneFiles, currentFile, results } = progress
  const pct = totalFiles > 0 ? Math.round((doneFiles / totalFiles) * 100) : 0
  const partial = summarize(results)

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-surface rounded-xl border shadow-lg overflow-hidden">
      <div className="px-4 py-3 bg-blue-50 flex items-center gap-2">
        <Loader2 size={16} className="animate-spin text-costco-blue" />
        <span className="text-sm font-semibold text-costco-blue">
          Importing... {doneFiles}/{totalFiles}
        </span>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="space-y-1">
          <div className="h-1.5 bg-surface-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-costco-blue rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-text-3 truncate">{currentFile}</p>
        </div>

        {doneFiles > 0 && (
          <div className="flex gap-4 text-xs">
            {partial.totalImported > 0 && (
              <div>
                <span className="font-semibold text-emerald-600">{partial.totalImported}</span>
                <span className="text-text-3 ml-1">imported</span>
              </div>
            )}
            {partial.totalSkipped > 0 && (
              <div>
                <span className="font-semibold text-amber-600">{partial.totalSkipped}</span>
                <span className="text-text-3 ml-1">duplicates</span>
              </div>
            )}
            {partial.totalErrors > 0 && (
              <div>
                <span className="font-semibold text-danger">{partial.totalErrors}</span>
                <span className="text-text-3 ml-1">errors</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportToast({ report }: { report: ImportReport }) {
  const hasErrors = report.totalErrors > 0
  const allDuplicates = report.totalImported === 0 && report.totalSkipped > 0 && !hasErrors

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-surface rounded-xl border shadow-lg overflow-hidden">
      <div className={`px-4 py-3 flex items-center justify-between ${
        hasErrors ? 'bg-red-50' : allDuplicates ? 'bg-amber-50' : 'bg-emerald-50'
      }`}>
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <AlertCircle size={16} className="text-danger" />
          ) : allDuplicates ? (
            <Copy size={16} className="text-amber-600" />
          ) : (
            <Check size={16} className="text-emerald-600" />
          )}
          <span className="text-sm font-semibold">
            {hasErrors ? 'Import completed with errors' : allDuplicates ? 'All duplicates' : 'Import complete'}
          </span>
        </div>
        <button onClick={() => setToast(null)} className="text-text-3 hover:text-text cursor-pointer">
          <X size={14} />
        </button>
      </div>

      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-4 text-xs">
          {report.totalImported > 0 && (
            <div>
              <span className="font-semibold text-emerald-600 text-lg">{report.totalImported}</span>
              <p className="text-text-3">imported</p>
            </div>
          )}
          {report.totalSkipped > 0 && (
            <div>
              <span className="font-semibold text-amber-600 text-lg">{report.totalSkipped}</span>
              <p className="text-text-3">duplicates</p>
            </div>
          )}
          {report.totalErrors > 0 && (
            <div>
              <span className="font-semibold text-danger text-lg">{report.totalErrors}</span>
              <p className="text-text-3">errors</p>
            </div>
          )}
        </div>

        {(report.files.length > 1 || hasErrors) && (
          <div className="border-t pt-2 space-y-1.5 max-h-40 overflow-y-auto">
            {report.files.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                {f.error ? (
                  <AlertCircle size={12} className="text-danger mt-0.5 shrink-0" />
                ) : f.imported > 0 ? (
                  <Check size={12} className="text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <Copy size={12} className="text-amber-500 mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="font-medium truncate block">{f.name}</span>
                  <span className="text-text-3">
                    {f.error
                      ? f.error
                      : f.imported > 0
                        ? `${f.imported} imported${f.skipped > 0 ? `, ${f.skipped} duplicates` : ''}`
                        : `${f.skipped} duplicates`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
