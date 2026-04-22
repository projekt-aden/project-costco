import { useRef, useCallback, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileImage,
  FileText,
  FileUp,
  ShieldCheck,
  Terminal,
  Upload,
} from 'lucide-react'
import { startImport } from '../components/receipt/import-button'

const SCRIPT_URL = 'https://github.com/projekt-aden/project-costco/blob/main/public/costco-export.js'
type ImportMethod = 'pdf' | 'json' | null

const PDF_GUIDE_STEPS = [
  {
    number: '01',
    title: 'Sign in to Costco',
    description: 'Open your Costco account in a browser and sign in before opening receipt history.',
    image: '/import-guides/pdf-receipt-download/steps/01-sign-in.png',
  },
  {
    number: '02',
    title: 'Open Orders & Purchases',
    description: 'Go to your account history and open the section where Costco shows past warehouse receipts.',
    image: '/import-guides/pdf-receipt-download/steps/02-open-orders-or-receipts.png',
  },
  {
    number: '04',
    title: 'Open Print or Download',
    description: 'Open the receipt you want to save, then use Costco’s print or download action for that receipt.',
    image: '/import-guides/pdf-receipt-download/steps/04-find-print-or-download.png',
  },
  {
    number: '05',
    title: 'Save as PDF',
    description: 'In the browser print dialog choose Save as PDF and keep the default full receipt layout.',
    image: '/import-guides/pdf-receipt-download/steps/05-save-as-pdf.png',
  },
  {
    number: '06',
    title: 'Import PDF into the app',
    description: 'Drop one or more saved PDF receipts into the importer below. You can import them in batches.',
    image: '/import-guides/pdf-receipt-download/steps/06-import-into-app.png',
  },
] as const

const JSON_GUIDE_STEPS = [
  'Sign in at costco.com and open In-Warehouse Receipts.',
  'Open DevTools Console, and if paste is blocked type allow pasting first, then press Enter.',
  'Paste the export script, run it, and wait for Costco receipt history to download as one JSON file.',
  'Import that JSON file into this app.',
] as const

const BROWSER_NOTES = [
  {
    title: 'Chrome',
    body: 'Chrome DevTools can block the first paste in Console as a self-XSS protection. If that happens, click into Console, type allow pasting, press Enter, and then paste the script again.',
  },
  {
    title: 'Edge and other Chromium browsers',
    body: 'Microsoft Edge DevTools ships Chromium DevTools updates, so users may hit the same self-XSS paste warning as Chrome. This can also affect Chromium-based browsers such as Brave or Arc.',
  },
  {
    title: 'Firefox',
    body: 'Firefox also uses console paste protection. If Firefox blocks the script paste, type allow pasting in the console first, press Enter, and then paste the script.',
  },
  {
    title: 'Safari',
    body: 'Safari usually needs the Develop menu enabled before Web Inspector is available. Open Safari developer tools first, then run the script in the JavaScript Console.',
  },
] as const

// Embedded script for copy button (keep in sync with public/costco-export.js)
const EXPORT_SCRIPT = `const YEARS_BACK = 2;
const MONTHS_PER_CHUNK = 6;
const DELAY_MS = 1000;

(async function costcoExport() {
  const log = (msg) => console.log(\`%c[Export] \${msg}\`, 'color: #e21836; font-weight: bold');
  const ok = (msg) => console.log(\`%c[Export] ✓ \${msg}\`, 'color: #10b981; font-weight: bold');
  const fail = (msg) => console.log(\`%c[Export] ✗ \${msg}\`, 'color: #ef4444; font-weight: bold');

  log('Starting Costco receipt export...');

  const raw = localStorage.getItem('idToken');
  if (!raw) { fail('No idToken found. Sign in on costco.com first.'); return; }

  try {
    const payload = JSON.parse(atob(raw.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const mins = Math.round((payload.exp * 1000 - Date.now()) / 60000);
    if (mins <= 0) { fail('Token expired. Refresh the page.'); return; }
    ok(\`Signed in as \${payload.email || payload.name} (token valid for \${mins} min)\`);
  } catch { fail('Could not decode token.'); return; }

  const token = \`Bearer \${raw}\`;
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - YEARS_BACK);

  const chunks = [];
  let cursor = new Date(startDate);
  while (cursor < endDate) {
    const chunkEnd = new Date(cursor);
    chunkEnd.setMonth(chunkEnd.getMonth() + MONTHS_PER_CHUNK);
    if (chunkEnd > endDate) chunkEnd.setTime(endDate.getTime());
    chunks.push([new Date(cursor), new Date(chunkEnd)]);
    cursor = new Date(chunkEnd);
    cursor.setDate(cursor.getDate() + 1);
  }

  log(\`Fetching \${YEARS_BACK} years in \${chunks.length} chunks...\`);

  const allReceipts = [];
  const seen = new Set();
  const fmt = (d) => \`\${d.getMonth()+1}/\${d.getDate()}/\${d.getFullYear()}\`;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const GQL = 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql';
  const HEADERS = {
    'Content-Type': 'application/json-patch+json',
    'costco-x-authorization': token,
    'client-identifier': '481b1aec-aa3b-454b-b81b-48187e28f205',
    'costco-x-wcs-clientId': '4900eb1f-0c10-4bd9-99c3-c59e6c1ecebf',
    'costco.env': 'ecom', 'costco.service': 'restOrders',
  };

  const QUERY = \`query receiptsWithCounts($startDate: String, $endDate: String, $documentType: String, $documentSubType: String) {
    receiptsWithCounts(startDate: $startDate, endDate: $endDate, documentType: $documentType, documentSubType: $documentSubType) {
      inWarehouse
      receipts {
        warehouseName receiptType documentType transactionDateTime transactionDate
        transactionBarcode transactionType total subTotal taxes totalItemCount
        warehouseAddress1 warehouseCity warehouseState warehousePostalCode membershipNumber
        itemArray { itemNumber itemDescription01 itemDescription02 itemIdentifier itemDepartmentNumber unit amount taxFlag itemUnitPriceAmount fuelUnitQuantity fuelGradeCode fuelGradeDescription fuelUomCode }
        tenderArray { tenderTypeCode tenderDescription amountTender displayAccountNumber }
        subTaxes { tax1 tax2 tax3 tax4 aTaxAmount bTaxAmount cTaxAmount dTaxAmount uTaxAmount }
        instantSavings
      }
    }
  }\`;

  for (let i = 0; i < chunks.length; i++) {
    const [from, to] = chunks[i];
    log(\`Chunk \${i + 1}/\${chunks.length}: \${fmt(from)} → \${fmt(to)}\`);
    try {
      const res = await fetch(GQL, { method: 'POST', headers: HEADERS, body: JSON.stringify({ query: QUERY, variables: { startDate: fmt(from), endDate: fmt(to), documentType: 'all', documentSubType: 'all' } }) });
      if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
      const data = await res.json();
      if (data.errors?.length) throw new Error(data.errors[0].message);
      const receipts = data.data?.receiptsWithCounts?.receipts || [];
      let added = 0;
      for (const r of receipts) { const key = r.transactionBarcode || \`\${r.transactionDate}_\${r.total}\`; if (!seen.has(key)) { seen.add(key); allReceipts.push(r); added++; } }
      ok(\`  \${receipts.length} found, \${added} new\`);
    } catch (err) {
      fail(\`  Error: \${err.message}\`);
      if (err.message.includes('401')) { fail('Token expired. Refresh the page.'); return; }
    }
    if (i < chunks.length - 1) await sleep(DELAY_MS);
  }

  if (allReceipts.length === 0) { fail('No receipts found.'); return; }

  const blob = new Blob([JSON.stringify(allReceipts, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = \`costco-receipts-\${allReceipts.length}.json\`;
  a.click();
  URL.revokeObjectURL(url);
  ok(\`Done! Downloaded \${allReceipts.length} receipts.\`);
})();`

export function ScanPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedMethod, setSelectedMethod] = useState<ImportMethod>(null)

  const handleFiles = useCallback((files: FileList | File[]) => {
    if (files.length > 0) startImport(files)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Import</h2>
        <p className="text-sm text-text-2 max-w-3xl">Choose how you want to bring Costco receipts into the app.</p>
      </div>

      {selectedMethod === null ? (
        <MethodSelectionScreen onSelect={setSelectedMethod} />
      ) : (
        <InstructionScreen
          method={selectedMethod}
          onBack={() => setSelectedMethod(null)}
          inputRef={inputRef}
          onFiles={handleFiles}
        />
      )}
    </div>
  )
}

function MethodSelectionScreen({ onSelect }: { onSelect: (method: ImportMethod) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <MethodSummaryCard
          icon={<FileText size={20} />}
          title="Simple PDF Import"
          badge="Recommended"
          accentClassName="bg-emerald-50 text-emerald-700 border-emerald-200"
          description="Save receipts as PDF on costco.com and upload them here."
          points={[
            'Best for a few receipts',
            'No console or script needed',
            'Good for quick manual imports',
          ]}
          onClick={() => onSelect('pdf')}
        />

        <MethodSummaryCard
          icon={<Terminal size={20} />}
          title="Advanced JSON Export"
          badge="Bulk"
          accentClassName="bg-costco-blue/10 text-costco-blue border-costco-blue/20"
          description="Run one console script on costco.com and export many receipts at once."
          points={[
            'Best for large history imports',
            'Requires DevTools Console',
            'Fastest bulk import path',
          ]}
          onClick={() => onSelect('json')}
        />
      </div>

      <div className="rounded-2xl border bg-surface px-5 py-4 text-sm text-text-2">
        Pick a card to open step-by-step instructions for that import method.
      </div>
    </div>
  )
}

function MethodSummaryCard({
  icon,
  title,
  badge,
  accentClassName,
  description,
  points,
  onClick,
}: {
  icon: ReactNode
  title: string
  badge: string
  accentClassName: string
  description: string
  points: string[]
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-surface rounded-2xl border p-5 space-y-4 text-left transition-all hover:-translate-y-0.5 hover:border-costco-red/30 hover:shadow-md cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-surface-2 flex items-center justify-center text-costco-red">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-xs text-text-3">{description}</p>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${accentClassName}`}>
          {badge}
        </span>
      </div>

      <div className="space-y-2">
        {points.map((point) => (
          <div key={point} className="flex items-start gap-2 text-sm text-text-2">
            <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
            <span>{point}</span>
          </div>
        ))}
      </div>
    </button>
  )
}

function InstructionScreen({
  method,
  onBack,
  inputRef,
  onFiles,
}: {
  method: Exclude<ImportMethod, null>
  onBack: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onFiles: (files: FileList | File[]) => void
}) {
  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-text-2 hover:text-text cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to import methods
      </button>

      {method === 'pdf' ? <PdfImportGuide /> : <BulkExportCard />}

      <ImportDropzone inputRef={inputRef} onFiles={onFiles} preferredMethod={method} />
    </div>
  )
}

function PdfImportGuide() {
  return (
    <section className="bg-surface rounded-2xl border overflow-hidden">
      <div className="px-6 py-5 border-b bg-[linear-gradient(135deg,rgba(16,185,129,0.12),rgba(255,255,255,0))]">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileImage size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold">How to Save Costco Receipts as PDF</h3>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                No console required
              </span>
            </div>
            <p className="text-sm text-text-2">
              Follow these screenshots on costco.com, save each receipt as a PDF, then import the files here.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <GuideCallout
            title="Best for"
            text="A few receipts, occasional imports, or anyone who does not want to use DevTools."
          />
          <GuideCallout
            title="What to save"
            text="Use the browser print dialog and choose Save as PDF so the receipt keeps its layout."
          />
          <GuideCallout
            title="Tip"
            text="Repeat the same save flow for multiple receipts, then drop all PDFs into the importer at once."
          />
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {PDF_GUIDE_STEPS.map((step) => (
            <article
              key={step.number}
              className="group overflow-hidden rounded-2xl border bg-surface-2/50 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="aspect-[16/11] overflow-hidden bg-surface-3">
                <img
                  src={step.image}
                  alt={`${step.title} screenshot`}
                  className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.015]"
                  loading="lazy"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-costco-red text-xs font-bold text-white">
                    {step.number}
                  </span>
                  <h4 className="font-semibold">{step.title}</h4>
                </div>
                <p className="text-sm leading-6 text-text-2">{step.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function GuideCallout({ title, text }: { title: string, text: string }) {
  return (
    <div className="rounded-xl border border-emerald-200/70 bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">{title}</p>
      <p className="mt-1 text-sm text-text-2">{text}</p>
    </div>
  )
}

function ImportDropzone({
  inputRef,
  onFiles,
  preferredMethod,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>
  onFiles: (files: FileList | File[]) => void
  preferredMethod: Exclude<ImportMethod, null>
}) {
  const helperText = preferredMethod === 'pdf'
    ? 'Upload the PDFs you saved from Costco'
    : 'Upload the JSON file exported from Costco'

  return (
    <div className="bg-surface rounded-xl border p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-50 text-costco-red rounded-lg flex items-center justify-center">
          <Upload size={20} />
        </div>
        <div>
          <h3 className="font-semibold">Import Receipts</h3>
          <p className="text-xs text-text-3">{helperText}</p>
        </div>
      </div>

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          if (e.dataTransfer.files.length > 0) onFiles(e.dataTransfer.files)
        }}
        className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-costco-red/40 hover:bg-surface-3 transition-all"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".json,.pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onFiles(e.target.files)
          }}
        />
        <FileUp size={32} className="mx-auto mb-3 text-costco-red" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-text-3 mt-1">PDF and JSON supported</p>
      </div>
    </div>
  )
}

function BulkExportCard() {
  const [copied, setCopied] = useState(false)
  const [showScript, setShowScript] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(EXPORT_SCRIPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-surface rounded-2xl border p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-costco-blue/10 text-costco-blue rounded-lg flex items-center justify-center">
          <Terminal size={20} />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">Advanced: Bulk Export from Costco</h3>
            <span className="rounded-full bg-costco-blue/10 px-2.5 py-1 text-[11px] font-semibold text-costco-blue">
              JSON
            </span>
          </div>
          <p className="text-xs text-text-3">Download many receipts at once through the browser console</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-surface-2 rounded-xl p-4 space-y-3">
          {JSON_GUIDE_STEPS.map((step, index) => (
            <div key={step} className="flex items-start gap-3">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-costco-blue text-[11px] font-bold text-white">
                {index + 1}
              </span>
              <p className="text-sm text-text-2 leading-6">{step}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-2 bg-costco-dark text-white rounded-lg text-xs font-medium hover:bg-costco-dark/90 transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy script to clipboard'}
          </button>

          <div className="flex items-start gap-2 bg-emerald-50 rounded-lg px-3 py-2">
            <ShieldCheck size={14} className="text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-xs text-emerald-700">
              Runs entirely in your browser on costco.com. Reads auth token from localStorage and fetches receipts via Costco&apos;s own API.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-costco-red">Important</p>
        <p className="mt-2 text-sm leading-6 text-text">
          If the browser blocks paste in DevTools Console, first type this exact text into the console and press Enter:
        </p>
        <div className="mt-3 rounded-lg bg-costco-dark px-4 py-3 overflow-x-auto">
          <code className="text-sm font-mono text-white">allow pasting</code>
        </div>
        <p className="mt-3 text-sm leading-6 text-text-2">
          After that, paste the Costco export script and run it again.
        </p>
      </div>

      <div className="rounded-xl border bg-amber-50/60 px-4 py-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Browser Notes</p>
          <p className="mt-1 text-sm text-text-2">
            Running console scripts is slightly different across browsers. These notes help avoid the most common import blockers.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {BROWSER_NOTES.map((note) => (
            <div key={note.title} className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3">
              <p className="font-semibold text-sm">{note.title}</p>
              <p className="mt-1 text-sm leading-6 text-text-2">{note.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowScript(!showScript)}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-text-2 hover:bg-surface-3 transition-colors cursor-pointer"
        >
          <span>View script source</span>
          <ChevronDown size={14} className={`transition-transform ${showScript ? 'rotate-180' : ''}`} />
        </button>
        {showScript && (
          <div className="border-t">
            <pre className="bg-costco-dark text-white/80 p-4 text-[10px] leading-relaxed font-mono overflow-x-auto max-h-64 overflow-y-auto">
              {EXPORT_SCRIPT}
            </pre>
            <div className="px-4 py-2 bg-surface-2 flex items-center justify-between">
              <a
                href={SCRIPT_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-[10px] text-costco-blue hover:underline"
              >
                <ExternalLink size={10} />
                View on GitHub
              </a>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[10px] text-text-3 hover:text-text cursor-pointer"
              >
                {copied ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
