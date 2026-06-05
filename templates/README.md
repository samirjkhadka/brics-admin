# DOCX Templates

Place Word templates in this folder before using export features.

## Receipt (`REC_BRICS WORLD TRAVEL AND TOURS PVT LTD.docx`)

Primary receipt template used by the app. Also accepted as `receipt_template.docx`.

- **View sample (HTML):** `/dashboard/reports/receipt/sample`
- **Download blank template:** `/api/templates/receipt/sample`

For populated DOCX export via docxtemplater, add these placeholders to the Word file:

- `{receiptNo}`, `{partyName}`, `{amount}`, `{amountWords}`
- `{paymentMethod}`, `{chequeNo}`, `{dateBS}`, `{dateAD}`
- `{travelDate}`, `{sector}`, `{bankName}`

The on-screen and print receipt layout matches this template even without placeholders.

## Invoice (`invoice_template.docx`)

Used by `/api/export/pdf/[id]`.

Placeholders: `{passengerNames}`, `{partyName}`, `{sector}`, `{billNo}`, `{dateBS}`, `{dateAD}`, `{salesAmount}`, `{taxableAmount}`, `{vatAmount}`, `{hsCode}`, `{partyVat}`, `{contact}`

## Report samples

Each report page has a **View Sample** button:

| Report | Sample page |
|--------|-------------|
| Balance Confirmation | `/dashboard/reports/balance-confirmation/sample` |
| Statements | `/dashboard/reports/statements/sample` |
| VAT Report | `/dashboard/reports/vat/sample` |
