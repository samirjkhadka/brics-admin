import db from "@/lib/db";
import { FiscalYearStatus } from "@prisma/client";
import {
    formatBillNo,
    formatReceiptNo,
    getFiscalYearBounds,
    getCurrentNepalFyStartYear,
    resolveBsYearStartFromAdDate,
    isDateInFiscalYear,
} from "./nepal-fy";
import { DEFAULT_BILL_FORMAT, DEFAULT_RECEIPT_FORMAT } from "./bill-format";
import {
    findNextAvailableBillSequence,
    findNextAvailableBillSequences,
} from "./bill-sequence";

export async function getActiveFinancialYear() {
    return db.financialYear.findFirst({
        where: { status: FiscalYearStatus.OPEN },
        orderBy: { startDateAD: "desc" },
    });
}

export async function ensureActiveFinancialYear() {
    const existing = await getActiveFinancialYear();
    if (existing) return existing;

    const bsYearStart = getCurrentNepalFyStartYear();
    const bounds = getFiscalYearBounds(bsYearStart);

    return db.financialYear.create({
        data: {
            label: bounds.label,
            bsYearStart: bounds.bsYearStart,
            billPrefixYear: bounds.billPrefixYear,
            startDateAD: bounds.startDateAD,
            endDateAD: bounds.endDateAD,
            startDateBS: bounds.startDateBS,
            endDateBS: bounds.endDateBS,
            status: FiscalYearStatus.OPEN,
            nextBillSeq: 1,
            nextReceiptSeq: 1,
            billNoFormat: DEFAULT_BILL_FORMAT,
            receiptNoFormat: DEFAULT_RECEIPT_FORMAT,
        },
    });
}

export async function resolveFinancialYearForDate(salesDate: Date) {
    const active = await ensureActiveFinancialYear();
    if (isDateInFiscalYear(salesDate, active.startDateAD, active.endDateAD)) {
        return active;
    }

    const bsYearStart = resolveBsYearStartFromAdDate(salesDate);
    const found = await db.financialYear.findFirst({
        where: { bsYearStart },
    });
    if (found) return found;

    const bounds = getFiscalYearBounds(bsYearStart);
    return db.financialYear.create({
        data: {
            label: bounds.label,
            bsYearStart: bounds.bsYearStart,
            billPrefixYear: bounds.billPrefixYear,
            startDateAD: bounds.startDateAD,
            endDateAD: bounds.endDateAD,
            startDateBS: bounds.startDateBS,
            endDateBS: bounds.endDateBS,
            status: FiscalYearStatus.CLOSED,
            nextBillSeq: 1,
            nextReceiptSeq: 1,
            billNoFormat: DEFAULT_BILL_FORMAT,
            receiptNoFormat: DEFAULT_RECEIPT_FORMAT,
        },
    });
}

async function getUsedBillSequences(fiscalYearId: string): Promise<number[]> {
    const rows = await db.transaction.findMany({
        where: { fiscalYearId, billSequence: { not: null } },
        select: { billSequence: true },
    });
    return rows.map((row) => row.billSequence!);
}

export type AllocatedBillNo = {
    fiscalYearId: string;
    billSequence: number;
    salesBillNo: string;
    billPrefixYear: number;
};

export async function allocateBillSequences(
    fiscalYearId: string,
    count = 1
): Promise<AllocatedBillNo[]> {
    const fy = await db.financialYear.findUnique({ where: { id: fiscalYearId } });
    if (!fy) throw new Error("No active financial year");
    if (fy.status !== FiscalYearStatus.OPEN) {
        throw new Error("Cannot create bills in a closed financial year");
    }

    return db.$transaction(async (tx) => {
        const rows = await tx.transaction.findMany({
            where: { fiscalYearId, billSequence: { not: null } },
            select: { billSequence: true },
        });
        const used = rows.map((row) => row.billSequence!);
        const sequences = findNextAvailableBillSequences(used, count);
        const maxSeq = sequences[sequences.length - 1];

        await tx.financialYear.update({
            where: { id: fiscalYearId },
            data: { nextBillSeq: Math.max(fy.nextBillSeq, maxSeq + 1) },
        });

        return sequences.map((seq) => ({
            fiscalYearId: fy.id,
            billSequence: seq,
            salesBillNo: formatBillNo(fy.billPrefixYear, seq, fy.billNoFormat),
            billPrefixYear: fy.billPrefixYear,
        }));
    });
}

export async function allocateNextSalesBillNo(fiscalYearId?: string) {
    const fy = fiscalYearId
        ? await db.financialYear.findUnique({ where: { id: fiscalYearId } })
        : await ensureActiveFinancialYear();

    if (!fy) throw new Error("No active financial year");

    const [bill] = await allocateBillSequences(fy.id, 1);
    return bill;
}

export async function peekNextSalesBillNo() {
    const fy = await ensureActiveFinancialYear();
    if (!fy) return "";
    const used = await getUsedBillSequences(fy.id);
    const seq = findNextAvailableBillSequence(used);
    return formatBillNo(fy.billPrefixYear, seq, fy.billNoFormat);
}

export async function peekSalesBillNos(count: number): Promise<string[]> {
    const fy = await ensureActiveFinancialYear();
    if (!fy || count <= 0) return [];
    const used = await getUsedBillSequences(fy.id);
    const sequences = findNextAvailableBillSequences(used, count);
    return sequences.map((seq) => formatBillNo(fy.billPrefixYear, seq, fy.billNoFormat));
}

export async function allocateNextReceiptNo(fiscalYearId: string) {
    const updated = await db.financialYear.update({
        where: { id: fiscalYearId },
        data: { nextReceiptSeq: { increment: 1 } },
    });
    const seq = updated.nextReceiptSeq - 1;
    return formatReceiptNo(updated.billPrefixYear, seq, updated.receiptNoFormat);
}

export async function peekNextReceiptNo(fiscalYearId?: string) {
    const fy = fiscalYearId
        ? await db.financialYear.findUnique({ where: { id: fiscalYearId } })
        : await ensureActiveFinancialYear();
    if (!fy) return "";
    return formatReceiptNo(fy.billPrefixYear, fy.nextReceiptSeq, fy.receiptNoFormat);
}
