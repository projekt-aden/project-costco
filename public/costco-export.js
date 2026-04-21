/**
 * Costco Receipt Exporter
 *
 * Exports all your Costco receipts as a JSON file.
 * Run in browser console on costco.com while signed in.
 *
 * Usage:
 *   1. Go to https://www.costco.com and sign in
 *   2. Open DevTools (F12) → Console
 *   3. Paste this entire script and press Enter
 *   4. Wait for the JSON file to download
 *
 * Options (edit before running):
 */
const YEARS_BACK = 2;
const MONTHS_PER_CHUNK = 6;
const DELAY_MS = 1000;

(async function costcoExport() {
  const log = (msg) => console.log(`%c[Export] ${msg}`, 'color: #e21836; font-weight: bold');
  const ok = (msg) => console.log(`%c[Export] ✓ ${msg}`, 'color: #10b981; font-weight: bold');
  const fail = (msg) => console.log(`%c[Export] ✗ ${msg}`, 'color: #ef4444; font-weight: bold');

  log('Starting Costco receipt export...');

  // ─── Get token ───
  const raw = localStorage.getItem('idToken');
  if (!raw) {
    fail('No idToken found. Make sure you are signed in on costco.com.');
    return;
  }

  try {
    const payload = JSON.parse(atob(raw.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const mins = Math.round((payload.exp * 1000 - Date.now()) / 60000);
    if (mins <= 0) {
      fail('Token expired. Refresh the page and try again.');
      return;
    }
    ok(`Signed in as ${payload.email || payload.name} (token valid for ${mins} min)`);
  } catch {
    fail('Could not decode token.');
    return;
  }

  const token = `Bearer ${raw}`;

  // ─── Build date chunks ───
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

  log(`Fetching ${YEARS_BACK} years of receipts in ${chunks.length} chunks...`);

  // ─── Fetch all receipts ───
  const allReceipts = [];
  const seen = new Set();

  for (let i = 0; i < chunks.length; i++) {
    const [from, to] = chunks[i];
    log(`Chunk ${i + 1}/${chunks.length}: ${fmt(from)} → ${fmt(to)}`);

    try {
      const receipts = await fetchReceipts(token, from, to);
      let added = 0;
      for (const r of receipts) {
        const key = r.transactionBarcode || `${r.transactionDate}_${r.total}`;
        if (!seen.has(key)) {
          seen.add(key);
          allReceipts.push(r);
          added++;
        }
      }
      ok(`  ${receipts.length} found, ${added} new`);
    } catch (err) {
      fail(`  Error: ${err.message}`);
      if (err.message.includes('401')) {
        fail('Token expired. Refresh the page and try again.');
        return;
      }
    }

    if (i < chunks.length - 1) await sleep(DELAY_MS);
  }

  if (allReceipts.length === 0) {
    fail('No receipts found.');
    return;
  }

  // ─── Download JSON ───
  const blob = new Blob([JSON.stringify(allReceipts, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `costco-receipts-${allReceipts.length}.json`;
  a.click();
  URL.revokeObjectURL(url);

  ok(`Done! Downloaded ${allReceipts.length} receipts.`);
  log('Import this file into Costco Tracker.');

  // ─── API ───

  const GQL = 'https://ecom-api.costco.com/ebusiness/order/v1/orders/graphql';
  const HEADERS = {
    'Content-Type': 'application/json-patch+json',
    'costco-x-authorization': token,
    'client-identifier': '481b1aec-aa3b-454b-b81b-48187e28f205',
    'costco-x-wcs-clientId': '4900eb1f-0c10-4bd9-99c3-c59e6c1ecebf',
    'costco.env': 'ecom',
    'costco.service': 'restOrders',
  };

  const QUERY = `query receiptsWithCounts($startDate: String, $endDate: String, $documentType: String, $documentSubType: String) {
    receiptsWithCounts(startDate: $startDate, endDate: $endDate, documentType: $documentType, documentSubType: $documentSubType) {
      inWarehouse
      receipts {
        warehouseName receiptType documentType transactionDateTime transactionDate
        transactionBarcode transactionType total subTotal taxes totalItemCount
        warehouseAddress1 warehouseCity warehouseState warehousePostalCode membershipNumber
        itemArray {
          itemNumber itemDescription01 itemDescription02 itemIdentifier
          itemDepartmentNumber unit amount taxFlag itemUnitPriceAmount
          fuelUnitQuantity fuelGradeCode fuelGradeDescription fuelUomCode
        }
        tenderArray { tenderTypeCode tenderDescription amountTender displayAccountNumber }
        subTaxes { tax1 tax2 tax3 tax4 aTaxAmount bTaxAmount cTaxAmount dTaxAmount uTaxAmount }
        instantSavings
      }
    }
  }`;

  async function fetchReceipts(authToken, start, end) {
    const res = await fetch(GQL, {
      method: 'POST',
      headers: { ...HEADERS, 'costco-x-authorization': authToken },
      body: JSON.stringify({
        query: QUERY,
        variables: { startDate: fmt(start), endDate: fmt(end), documentType: 'all', documentSubType: 'all' },
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.errors?.length) throw new Error(data.errors[0].message);
    return data.data?.receiptsWithCounts?.receipts || [];
  }

  function fmt(d) { return `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`; }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
})();
