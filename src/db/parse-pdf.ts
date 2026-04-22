import type { Receipt, ReceiptItem } from '../types/receipt'

let counter = 0
function makeId(): string {
  counter++
  return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}

async function extractLines(file: ArrayBuffer): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString()

  const pdf = await pdfjsLib.getDocument({ data: file }).promise
  const allLines: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // Group text items by y-coordinate (same line = similar y)
    const lineMap = new Map<number, { x: number; text: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const y = Math.round(item.transform[5])
      const x = Math.round(item.transform[4])

      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push({ x, text: item.str })
    }

    // Sort lines top-to-bottom (higher y = higher on page), items left-to-right
    const sorted = Array.from(lineMap.entries())
      .sort(([a], [b]) => b - a)
      .map(([, items]) => {
        items.sort((a, b) => a.x - b.x)
        return items.map((i) => i.text).join(' ')
      })

    allLines.push(...sorted)
  }

  return allLines
}

// Item line: "E 10579 SALMON 23.51 N" or "E 40532 9.39 N" (no description — it's on adjacent lines)
const ITEM_LINE_RE = /^([A-Z])\s+(\d+)\s+(.+?)\s+([\d.]+)\s+([A-Z])$/
const ITEM_LINE_NO_DESC_RE = /^([A-Z])\s+(\d+)\s+([\d.]+)\s+([A-Z])$/
const SUBTOTAL_RE = /SUBTOTAL\s+([\d.]+)/
const TAX_RE = /^TAX\s+([\d.]+)$/
const TOTAL_LINE_RE = /\*{3,}\s+TOTAL\s+([\d.]+)/
const WAREHOUSE_RE = /^(.+?)\s*#\s*(\d+)$/
const BARCODE_RE = /^\d{15,}$/
const DATE_RE = /(\d{2}\/\d{2}\/\d{4})/
const DESC_FRAGMENT_RE = /^[A-Z][A-Z0-9 /.%-]+$/

export async function parseReceiptsFromPdf(file: ArrayBuffer): Promise<Receipt[]> {
  const lines = await extractLines(file)
  return [parseSingleReceipt(lines)]
}

function parseSingleReceipt(lines: string[]): Receipt {
  let warehouseName = ''
  let transactionBarcode = ''
  let transactionDate = ''
  let subtotal = 0
  let tax = 0
  let total = 0

  // First pass: find items and their indices
  interface RawItem {
    index: number
    dept: string
    itemNumber: string
    descParts: string[]
    amount: number
    taxFlag: string
  }

  const rawItems: RawItem[] = []
  const itemIndices = new Set<number>()
  let foundMember = false
  let subtotalIndex = lines.length

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Warehouse
    const whMatch = line.match(WAREHOUSE_RE)
    if (whMatch && !warehouseName) {
      warehouseName = line
      continue
    }

    // Barcode
    if (BARCODE_RE.test(line) && !transactionBarcode) {
      transactionBarcode = line
      continue
    }

    // Skip "Member" + member number
    if (line === 'Member') {
      foundMember = true
      continue
    }
    if (foundMember) {
      foundMember = false
      continue
    }

    // SUBTOTAL
    const subMatch = line.match(SUBTOTAL_RE)
    if (subMatch) {
      subtotal = parseFloat(subMatch[1])
      subtotalIndex = i
      continue
    }

    // TAX (not "TOTAL TAX")
    if (line.match(TAX_RE) && i > subtotalIndex) {
      tax = parseFloat(line.match(TAX_RE)![1])
      continue
    }

    // TOTAL with ****
    const totalMatch = line.match(TOTAL_LINE_RE)
    if (totalMatch) {
      total = parseFloat(totalMatch[1])
      continue
    }

    // Date
    if (!transactionDate) {
      const dateMatch = line.match(DATE_RE)
      if (dateMatch && !line.includes('Page') && !line.includes(',')) {
        const parts = dateMatch[1].split('/')
        if (parts.length === 3) {
          const [m, d, y] = parts
          transactionDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
        }
      }
    }

    // Item with description: "E 10579 SALMON 23.51 N"
    const fullMatch = line.match(ITEM_LINE_RE)
    if (fullMatch && i < subtotalIndex) {
      rawItems.push({
        index: i,
        dept: fullMatch[1],
        itemNumber: fullMatch[2],
        descParts: [fullMatch[3].trim()],
        amount: parseFloat(fullMatch[4]),
        taxFlag: fullMatch[5],
      })
      itemIndices.add(i)
      continue
    }

    // Item without description: "E 40532 9.39 N" (description on adjacent lines)
    const noDescMatch = line.match(ITEM_LINE_NO_DESC_RE)
    if (noDescMatch && i < subtotalIndex) {
      rawItems.push({
        index: i,
        dept: noDescMatch[1],
        itemNumber: noDescMatch[2],
        descParts: [],
        amount: parseFloat(noDescMatch[3]),
        taxFlag: noDescMatch[4],
      })
      itemIndices.add(i)
      continue
    }
  }

  // Second pass: attach orphan description fragments to the nearest item.
  // When equidistant, prefer items that have NO inline description (descParts empty)
  // since fragments belong to items whose description was split across lines.
  for (let i = 0; i < lines.length && i < subtotalIndex; i++) {
    if (itemIndices.has(i)) continue
    const line = lines[i].trim()
    if (!line || !DESC_FRAGMENT_RE.test(line)) continue
    // Skip known non-description lines
    if (WAREHOUSE_RE.test(line) || BARCODE_RE.test(line) || line === 'Member') continue
    if (line.startsWith('SUBTOTAL') || line.startsWith('TAX') || line.startsWith('TOTAL')) continue

    let bestItem: RawItem | null = null
    let bestDist = Infinity

    for (const item of rawItems) {
      const dist = Math.abs(item.index - i)
      if (dist > bestDist) continue
      if (dist < bestDist) {
        bestDist = dist
        bestItem = item
      } else {
        // Same distance: prefer item without inline description
        if (bestItem && bestItem.descParts.length > 0 && item.descParts.length === 0) {
          bestItem = item
        }
      }
    }

    if (bestItem && bestDist <= 2) {
      if (i < bestItem.index) {
        bestItem.descParts.unshift(line)
      } else {
        bestItem.descParts.push(line)
      }
    }
  }

  // Build final items
  const items: ReceiptItem[] = rawItems.map((raw) => ({
    id: makeId(),
    itemNumber: raw.itemNumber,
    description: raw.descParts.join(' ') || `Item #${raw.itemNumber}`,
    unitPrice: raw.amount,
    quantity: 1,
    amount: raw.amount,
    taxFlag: raw.taxFlag,
  }))

  if (items.length === 0) {
    throw new Error('Could not parse any items from this PDF')
  }

  if (total === 0 && subtotal > 0) {
    total = subtotal + tax
  }

  return {
    id: makeId(),
    transactionDate,
    transactionBarcode,
    warehouseName,
    receiptType: '',
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    items,
    coupons: [],
    importedAt: new Date().toISOString(),
  }
}
