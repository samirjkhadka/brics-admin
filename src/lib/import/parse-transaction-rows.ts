import { PaymentMethod } from "@prisma/client";
import { adToBs, bsStringToAd, formatAdDateLocal } from "@/lib/utils/nepali-calendar.client";
import { transactionSchema } from "@/lib/validations/transaction";

export type RawImportRow = Record<string, unknown>;

export type ImportRowError = {
    row: number;
    message: string;
};

const HEADER_MAP: Record<string, string> = {
    // Legacy BRICS spreadsheet headers
    "bill date (bs)": "purchaseDateBS",
    "bill date (ad)": "purchaseDate",
    "travel date": "travelDate",
    "purchase invoice no": "purchaseInvoiceNo",
    "purchase amount": "purchaseAmount",
    "sales date": "salesDate",
    "sales bill no": "salesBillNo",
    "client name": "passengerNames",
    party: "partyName",
    sector: "sector",
    "sale amount": "salesAmount",
    "segregate of sales amount as per bill": "salesAmountSegregate",
    exempt: "exemptAmount",
    taxable: "taxableAmount",
    "output vat": "outputVat",
    "recieved on": "receivedStatus",
    "received on": "receivedStatus",
    "received date": "receivedDate",
    "receipt no": "receiptNo",
    remarks: "remarks",
    "other remarks": "otherRemarks",
    "purchased from": "purchasePartyName",
    // Extended / alternate template headers
    "party name": "partyName",
    "sales date (ad)": "salesDate",
    "sales date (bs)": "salesDateBS",
    "purchase date (ad)": "purchaseDate",
    "purchase date (bs)": "purchaseDateBS",
    "travel date (ad)": "travelDate",
    "sales amount": "salesAmount",
    "exempt amt": "exemptAmount",
    "payment via": "receivedStatus",
    "cheque no": "chequeNo",
    "receipt date (ad)": "receivedDate",
    "party vat no": "partyVatNo",
    "contact no": "contactNo",
    "h.s. code": "hsCode",
    "passenger names": "passengerNames",
    "no of passengers": "noOfPassengers",
};

function normalizeHeader(h: string): string {
    return h.trim().toLowerCase();
}

export function isEmptyOrDash(value: unknown): boolean {
    const s = String(value ?? "").trim();
    return !s || s === "-";
}

/** Parses "Rs 13,000.00", plain numbers, and Excel serials. */
export function parseNprAmount(value: unknown): number {
    if (value == null || isEmptyOrDash(value)) return 0;
    if (typeof value === "number") return value;
    const str = String(value).trim();
    const cleaned = str.replace(/Rs\s*/gi, "").replace(/,/g, "").trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function isLikelyBsYear(year: number): boolean {
    return year >= 2080 && year <= 2099;
}

/** Parse a date cell that may be AD (2026-…) or BS (2083-…). */
export function parseImportDate(value: unknown): { ad: string; bs: string } {
    if (isEmptyOrDash(value)) return { ad: "", bs: "" };

    if (typeof value === "number") {
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        const ad = formatAdDateLocal(date);
        const year = parseInt(ad.split("-")[0], 10);
        // Excel/CSV often stores BS dates (2083-…) as serials interpreted as AD year 2083+
        if (isLikelyBsYear(year)) {
            const bs = ad;
            const convertedAd = bsStringToAd(bs);
            return { ad: convertedAd, bs };
        }
        try {
            return { ad, bs: adToBs(date) };
        } catch {
            return { ad, bs: "" };
        }
    }

    const str = String(value).trim();
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
        const year = parseInt(isoMatch[1], 10);
        const month = isoMatch[2].padStart(2, "0");
        const day = isoMatch[3].padStart(2, "0");
        if (isLikelyBsYear(year)) {
            const bs = `${year}-${month}-${day}`;
            const ad = bsStringToAd(bs);
            return { ad, bs };
        }
        const ad = `${year}-${month}-${day}`;
        try {
            return { ad, bs: adToBs(new Date(ad)) };
        } catch {
            return { ad, bs: "" };
        }
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
        const ad = formatAdDateLocal(d);
        try {
            return { ad, bs: adToBs(d) };
        } catch {
            return { ad, bs: "" };
        }
    }

    return { ad: "", bs: "" };
}

function parsePaymentMethod(value: unknown): PaymentMethod {
    const v = String(value || "BANK").toUpperCase().trim();
    if (v in PaymentMethod) return v as PaymentMethod;
    return PaymentMethod.BANK;
}

/** Legacy "Client Name" — supports "NAME * 2" passenger count suffix. */
export function parseClientName(value: unknown): string {
    const raw = String(value || "").trim();
    if (!raw) return JSON.stringify([{ name: "Unknown", ticketNo: "" }]);
    if (raw.startsWith("[")) return raw;

    const countMatch = raw.match(/^(.+?)\s*\*\s*(\d+)\s*$/);
    if (countMatch) {
        const name = countMatch[1].trim();
        const count = parseInt(countMatch[2], 10);
        const passengers = Array.from({ length: Math.max(1, count) }, () => ({
            name,
            ticketNo: "",
        }));
        return JSON.stringify(passengers);
    }

    const names = raw.split(",").map((n) => n.trim()).filter(Boolean);
    if (names.length > 1) {
        return JSON.stringify(names.map((name) => ({ name, ticketNo: "" })));
    }

    return JSON.stringify([{ name: raw, ticketNo: "" }]);
}

export function mapRawRow(raw: RawImportRow, rowIndex: number): Record<string, unknown> {
    const mapped: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(raw)) {
        const field = HEADER_MAP[normalizeHeader(key)];
        if (field) mapped[field] = value;
    }

    const purchaseDateParsed = parseImportDate(mapped.purchaseDate);
    const purchaseDate = purchaseDateParsed.ad || null;

    let purchaseDateBS = String(mapped.purchaseDateBS || "").trim();
    if (isEmptyOrDash(purchaseDateBS)) purchaseDateBS = "";
    if (!purchaseDateBS && purchaseDateParsed.bs) purchaseDateBS = purchaseDateParsed.bs;
    if (!purchaseDateBS && purchaseDate) {
        try {
            purchaseDateBS = adToBs(new Date(purchaseDate));
        } catch {
            purchaseDateBS = "";
        }
    }

    const salesDateParsed = parseImportDate(mapped.salesDate);
    const salesDate = salesDateParsed.ad;

    let salesDateBS = String(mapped.salesDateBS || "").trim();
    if (!salesDateBS && salesDateParsed.bs) salesDateBS = salesDateParsed.bs;
    if (salesDate && !salesDateBS) {
        try {
            salesDateBS = adToBs(new Date(salesDate));
        } catch {
            salesDateBS = "";
        }
    }

    const travelDateParsed = parseImportDate(mapped.travelDate);
    const travelDate = travelDateParsed.ad || null;
    const receivedDateParsed = parseImportDate(mapped.receivedDate);
    const receivedDate = receivedDateParsed.ad || null;

    let salesAmount = parseNprAmount(mapped.salesAmount);
    if (salesAmount === 0) {
        salesAmount = parseNprAmount(mapped.salesAmountSegregate);
    }

    const remarksParts = [
        String(mapped.remarks || "").trim(),
        String(mapped.otherRemarks || "").trim(),
    ].filter(Boolean);

    return {
        rowIndex,
        passengerNames: parseClientName(mapped.passengerNames),
        partyName: String(mapped.partyName || "").trim(),
        purchasePartyName: String(mapped.purchasePartyName || "").trim() || "Unspecified",
        sector: String(mapped.sector || "").trim(),
        salesBillNo: String(mapped.salesBillNo || "").trim(),
        salesDate,
        salesDateBS,
        purchaseInvoiceNo: String(mapped.purchaseInvoiceNo || "").trim(),
        purchaseDate,
        purchaseDateBS: purchaseDateBS || null,
        purchaseAmount: parseNprAmount(mapped.purchaseAmount),
        salesAmount,
        exemptAmount: parseNprAmount(mapped.exemptAmount),
        receivedStatus: parsePaymentMethod(mapped.receivedStatus),
        receivedDate,
        receiptNo: String(mapped.receiptNo || "").trim() || null,
        chequeNo: String(mapped.chequeNo || "").trim() || null,
        remarks: remarksParts.length > 0 ? remarksParts.join(" | ") : null,
        travelDate,
        partyVatNo: String(mapped.partyVatNo || "").trim() || null,
        contactNo: String(mapped.contactNo || "").trim() || null,
        hsCode: String(mapped.hsCode || "").trim() || null,
    };
}

export function isSkippableRow(mapped: Record<string, unknown>): boolean {
    if (isEmptyOrDash(mapped.salesBillNo)) return true;
    if (isEmptyOrDash(mapped.partyName)) return true;
    if (isEmptyOrDash(mapped.sector)) return true;
    const sales = Number(mapped.salesAmount) || 0;
    const purchase = Number(mapped.purchaseAmount) || 0;
    if (sales === 0 && purchase === 0) return true;
    return false;
}

export function parseAndValidateRows(rawRows: RawImportRow[]) {
    const validRows: Record<string, unknown>[] = [];
    const validRowNumbers: number[] = [];
    const errors: ImportRowError[] = [];

    rawRows.forEach((raw, index) => {
        const rowNum = index + 2;
        const hasData = Object.values(raw).some((v) => !isEmptyOrDash(v));
        if (!hasData) return;

        const mapped = mapRawRow(raw, rowNum);

        if (isSkippableRow(mapped)) return;

        const parsed = transactionSchema.safeParse(mapped);

        if (!parsed.success) {
            errors.push({
                row: rowNum,
                message: parsed.error.issues[0]?.message || "Invalid row data",
            });
        } else {
            validRows.push(parsed.data);
            validRowNumbers.push(rowNum);
        }
    });

    return { validRows, validRowNumbers, errors };
}
