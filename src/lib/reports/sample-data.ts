export const SAMPLE_RECEIPT = {
    receiptNo: "R-2083-001",
    receiptDateAD: "2026-06-05",
    receiptDateBS: "2083-02-22",
    partyName: "Himalayan Adventures Pvt. Ltd.",
    amount: 125000,
    paymentMethod: "CHEQUE" as const,
    chequeNo: "CHQ-458921",
    bankName: "Nepal Investment Bank",
    travelDate: "2026-07-15",
    sector: "KTM-DXB-KTM",
    billNo: "2083-042",
};

export const SAMPLE_BALANCE_CONFIRMATION = {
    fyLabel: "2082/83",
    startDateBS: "2082-04-01",
    endDateBS: "2083-03-32",
    partyName: "Himalayan Adventures Pvt. Ltd.",
    openingBalance: 25000,
    closingBalance: 87500,
    lines: [
        { voucherType: "Opening" as const, date: "—", dateBS: "—", billNo: null, reference: "Opening Balance", passengerNames: null, travelDateAD: null, travelDateBS: null, debit: 25000, credit: 0, balance: 25000 },
        { voucherType: "Sales" as const, date: "1/10/2026", dateBS: "2082-09-27", billNo: "2083-038", reference: "2083-038", passengerNames: "Ram Sharma", travelDateAD: "2/15/2026", travelDateBS: "2082-11-03", debit: 45000, credit: 0, balance: 70000 },
        { voucherType: "Receipt" as const, date: "2/5/2026", dateBS: "2082-10-23", billNo: null, receiptNo: "R-2083-012", reference: "R-2083-012", linkedBillNos: [] as string[], passengerNames: null, travelDateAD: null, travelDateBS: null, debit: 0, credit: 30000, balance: 40000 },
        { voucherType: "Sales" as const, date: "3/18/2026", dateBS: "2082-12-05", billNo: "2083-055", reference: "2083-055", passengerNames: "Sita Gurung, Hari Thapa", travelDateAD: "4/1/2026", travelDateBS: "2083-01-19", debit: 62000, credit: 0, balance: 102000 },
        { voucherType: "Receipt" as const, date: "4/22/2026", dateBS: "2083-02-09", billNo: "#2083-055", receiptNo: "R-2083-028", reference: "R-2083-028 — Bills #2083-055", linkedBillNos: ["2083-055"], passengerNames: null, travelDateAD: null, travelDateBS: null, debit: 0, credit: 14500, balance: 87500 },
    ],
};

export const SAMPLE_CUSTOMER_STATEMENT = {
    fyLabel: "2082/83",
    rows: [
        { partyName: "Himalayan Adventures Pvt. Ltd.", billed: 185000, received: 97500, balance: 87500 },
        { partyName: "Everest Trekking Co.", billed: 92000, received: 92000, balance: 0 },
        { partyName: "Annapurna Holidays", billed: 54000, received: 20000, balance: 34000 },
    ],
};

export const SAMPLE_SUPPLIER_STATEMENT = {
    fyLabel: "2082/83",
    rows: [
        { supplierName: "Air Arabia GSA", count: 12, purchase: 245000 },
        { supplierName: "Buddha Air", count: 8, purchase: 98000 },
        { supplierName: "Yeti Airlines", count: 5, purchase: 67500 },
    ],
};

export const SAMPLE_VAT_REPORT = {
    monthLabel: "June 2026",
    transactions: 18,
    totals: {
        sales: 485000,
        purchase: 312000,
        exempt: 45000,
        taxable: 440000,
        vat: 57200,
        profit: 173000,
    },
};
