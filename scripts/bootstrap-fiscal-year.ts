/**
 * One-time bootstrap: create active Nepal FY and link existing transactions.
 * Run: npx tsx scripts/bootstrap-fiscal-year.ts
 */
import { PrismaClient, FiscalYearStatus } from "@prisma/client";
import {
    getFiscalYearBounds,
    getCurrentNepalFyStartYear,
    resolveBsYearStartFromAdDate,
} from "../src/lib/fiscal-year/nepal-fy";

const db = new PrismaClient();

async function main() {
    let active = await db.financialYear.findFirst({
        where: { status: FiscalYearStatus.OPEN },
    });

    if (!active) {
        const bsYearStart = getCurrentNepalFyStartYear();
        const bounds = getFiscalYearBounds(bsYearStart);
        active = await db.financialYear.create({
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
            },
        });
        console.log(`Created active FY: ${active.label}`);
    } else {
        console.log(`Active FY exists: ${active.label}`);
    }

    const transactions = await db.transaction.findMany({
        where: { fiscalYearId: null },
    });

    for (const tx of transactions) {
        const bsStart = resolveBsYearStartFromAdDate(tx.salesDate);
        let fy = await db.financialYear.findFirst({ where: { bsYearStart: bsStart } });

        if (!fy) {
            const bounds = getFiscalYearBounds(bsStart);
            fy = await db.financialYear.create({
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
                },
            });
        }

        const legacySeq = parseInt(tx.salesBillNo, 10);
        await db.transaction.update({
            where: { id: tx.id },
            data: {
                fiscalYearId: fy.id,
                billSequence: isNaN(legacySeq) ? null : legacySeq,
            },
        });
    }

    const maxSeq = await db.transaction.aggregate({
        where: { fiscalYearId: active.id },
        _max: { billSequence: true },
    });
    const legacyMax = await db.transaction.findMany({
        where: { fiscalYearId: active.id },
        select: { salesBillNo: true },
    });
    let highest = maxSeq._max.billSequence || 0;
    for (const t of legacyMax) {
        const m = t.salesBillNo.match(/^(\d+)-(\d+)$/);
        if (m) highest = Math.max(highest, parseInt(m[2], 10));
    }

    await db.financialYear.update({
        where: { id: active.id },
        data: { nextBillSeq: highest + 1 },
    });

    console.log(`Linked ${transactions.length} transactions. Next bill seq: ${highest + 1}`);
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect());
