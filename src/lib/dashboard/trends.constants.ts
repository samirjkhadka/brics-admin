import { getBsMonthName } from "@/lib/nepali/month-names";

export type MonthlyTrendPoint = {
    month: string;
    monthIndex: number;
    bsMonth: number;
    sales: number;
    purchase: number;
    vat: number;
    profit: number;
};

const SHRAWAN_MONTH = 4;

/** Nepal FY months in order: Shrawan (4) through Ashadh (3). */
export const FISCAL_MONTH_ORDER = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3].map((bsMonth, monthIndex) => ({
    bsMonth,
    monthIndex,
    label: getBsMonthName(bsMonth),
}));

export function getFyMonthIndex(bsMonth: number): number {
    if (bsMonth >= SHRAWAN_MONTH) return bsMonth - SHRAWAN_MONTH;
    return bsMonth + (12 - SHRAWAN_MONTH);
}
