import db from "@/lib/db";
import { parseBsDateString } from "@/lib/utils/nepali-calendar";
import { FISCAL_MONTH_ORDER, getFyMonthIndex, type MonthlyTrendPoint } from "./trends.constants";

export type { MonthlyTrendPoint };
export { FISCAL_MONTH_ORDER, getFyMonthIndex } from "./trends.constants";

export async function getFiscalYearMonthlyTrends(
    startDateAD: Date,
    endDateAD: Date
): Promise<MonthlyTrendPoint[]> {
    const transactions = await db.transaction.findMany({
        where: {
            isVoided: false,
            salesDate: {
                gte: startDateAD,
                lte: endDateAD,
            },
        },
        select: {
            salesDateBS: true,
            salesAmount: true,
            purchaseAmount: true,
            vatAmount: true,
        },
    });

    const buckets = FISCAL_MONTH_ORDER.map(({ bsMonth, monthIndex, label }) => ({
        month: label,
        monthIndex,
        bsMonth,
        sales: 0,
        purchase: 0,
        vat: 0,
        profit: 0,
    }));

    for (const tx of transactions) {
        const parsed = parseBsDateString(tx.salesDateBS);
        const bsMonth = parsed?.month ?? 0;
        if (!bsMonth) continue;

        const idx = getFyMonthIndex(bsMonth);
        const sales = Number(tx.salesAmount);
        const purchase = Number(tx.purchaseAmount);
        const vat = Number(tx.vatAmount);

        buckets[idx].sales += sales;
        buckets[idx].purchase += purchase;
        buckets[idx].vat += vat;
        buckets[idx].profit += sales - purchase;
    }

    return buckets.map((b) => ({
        ...b,
        sales: Math.round(b.sales * 100) / 100,
        purchase: Math.round(b.purchase * 100) / 100,
        vat: Math.round(b.vat * 100) / 100,
        profit: Math.round(b.profit * 100) / 100,
    }));
}

/** @deprecated Use getFiscalYearMonthlyTrends with FY bounds */
export async function getFiscalYearMonthlyTrendsByCalendarYear(year: number): Promise<MonthlyTrendPoint[]> {
    const startDateAD = new Date(year, 0, 1);
    const endDateAD = new Date(year, 11, 31, 23, 59, 59, 999);
    return getFiscalYearMonthlyTrends(startDateAD, endDateAD);
}
