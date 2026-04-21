import { useRef, useCallback, useState } from 'react'
import { FileUp, Upload, Terminal, ExternalLink, ChevronDown, Copy, Check, ShieldCheck } from 'lucide-react'
import { startImport } from '../components/receipt/import-button'

const SCRIPT_URL = 'https://github.com/projekt-aden/project-costco/blob/main/public/costco-export.js'

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

  const handleFiles = useCallback((files: FileList | File[]) => {
    if (files.length > 0) startImport(files)
    if (inputRef.current) inputRef.current.value = ''
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Import</h2>

      <BulkExportCard />

      {/* File import */}
      <div className="bg-surface rounded-xl border p-6 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 text-costco-red rounded-lg flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="font-semibold">Import Receipts</h3>
            <p className="text-xs text-text-3">Upload the exported JSON file or individual PDFs</p>
          </div>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
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
              if (e.target.files) handleFiles(e.target.files)
            }}
          />
          <FileUp size={32} className="mx-auto mb-3 text-costco-red" />
          <p className="text-sm font-medium">Drop files here or click to browse</p>
          <p className="text-xs text-text-3 mt-1">PDF and JSON supported</p>
        </div>
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
    <div className="bg-surface rounded-xl border p-6 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-costco-blue/10 text-costco-blue rounded-lg flex items-center justify-center">
          <Terminal size={20} />
        </div>
        <div>
          <h3 className="font-semibold">Bulk Export from Costco</h3>
          <p className="text-xs text-text-3">Download all receipts at once (up to 2 years)</p>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-surface-2 rounded-xl p-4 text-xs text-text-2 space-y-3">
        <div className="space-y-1">
          <p className="font-medium text-text">1. Sign in</p>
          <p>Go to <a href="https://www.costco.com/myaccount/" target="_blank" rel="noopener" className="text-costco-blue underline">costco.com</a> and navigate to In-Warehouse Receipts</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text">2. Copy the export script</p>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-3 py-2 bg-costco-dark text-white rounded-lg text-xs font-medium hover:bg-costco-dark/90 transition-colors cursor-pointer"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy script to clipboard'}
          </button>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text">3. Run in console</p>
          <p>On costco.com press <kbd className="px-1.5 py-0.5 bg-surface-3 rounded text-[10px] font-mono">F12</kbd> → Console → paste → Enter</p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-text">4. Import the file</p>
          <p>The script downloads a JSON file. Drop it into the box below.</p>
        </div>
      </div>

      {/* Script preview (collapsible) */}
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

      {/* Privacy note */}
      <div className="flex items-start gap-2 bg-emerald-50 rounded-lg px-3 py-2">
        <ShieldCheck size={14} className="text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-700">
          Runs entirely in your browser on costco.com. Reads auth token from localStorage, fetches receipts via Costco's own API. No data is sent to any third-party server.
        </p>
      </div>
    </div>
  )
}
