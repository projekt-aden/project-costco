## Import Guide Assets

This folder is reserved for screenshot-based import guides shown inside the app.

Structure:

- `json-bulk-export/` - existing advanced import flow via Costco export script
- `pdf-receipt-download/` - new simple flow for saving receipts from Costco as PDF
- `shared/` - optional shared assets used by multiple guides

Recommended screenshot naming:

- `steps/01-landing.png`
- `steps/02-open-orders.png`
- `steps/03-open-receipt.png`
- `steps/04-save-pdf.png`

Rules:

- keep step numbers zero-padded: `01`, `02`, `03`
- prefer `.png` for UI screenshots
- keep filenames short and stable
- if mobile and desktop differ, use suffixes like `-desktop` and `-mobile`
- place any crop/zoom helper images in `shared/`

Future UI can read these folders directly from `/import-guides/...`.
