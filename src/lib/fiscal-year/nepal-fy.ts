import { adToBs, bsToAd, formatBsDate, formatAdDateLocal, parseBsDateString, getBsMonthDays } from "@/lib/utils/nepali-calendar";

/** Shrawan = month 4, Ashad = month 3 (end of Nepal FY). */
export const SHRAWAN_MONTH = 4;
export const ASHAD_MONTH = 3;

export type FiscalYearBounds = {
    label: string;
    bsYearStart: number;
    billPrefixYear: number;
    startDateBS: string;
    endDateBS: string;
    startDateAD: Date;
    endDateAD: Date;
};

export function getBillPrefixYear(bsYearStart: number): number {
    return bsYearStart + 1;
}

import {
    DEFAULT_BILL_FORMAT,
    DEFAULT_RECEIPT_FORMAT,
    formatFromTemplate,
} from "./bill-format";

export function formatBillNo(
    billPrefixYear: number,
    sequence: number,
    template = DEFAULT_BILL_FORMAT
): string {
    return formatFromTemplate(template, billPrefixYear, sequence);
}

export function formatReceiptNo(
    billPrefixYear: number,
    sequence: number,
    template = DEFAULT_RECEIPT_FORMAT
): string {
    return formatFromTemplate(template, billPrefixYear, sequence);
}

export function buildFiscalYearLabel(bsYearStart: number): string {
    const end = bsYearStart + 1;
    const endShort = String(end).slice(-2);
    return `${bsYearStart}/${endShort}`;
}

/** Build Nepal FY from BS year of Shrawan 1 (e.g. 2082 → FY 2082/083). */
export function getFiscalYearBounds(bsYearStart: number): FiscalYearBounds {
    const billPrefixYear = getBillPrefixYear(bsYearStart);
    const startDateBS = formatBsDate(bsYearStart, SHRAWAN_MONTH, 1);
    const endYear = bsYearStart + 1;
    const endDay = getBsMonthDays(endYear, ASHAD_MONTH);
    const endDateBS = formatBsDate(endYear, ASHAD_MONTH, endDay);

    const startDateAD = bsToAd(startDateBS);
    const endDateAD = bsToAd(endDateBS);
    endDateAD.setHours(23, 59, 59, 999);

    return {
        label: buildFiscalYearLabel(bsYearStart),
        bsYearStart,
        billPrefixYear,
        startDateBS,
        endDateBS,
        startDateAD,
        endDateAD,
    };
}

/** Resolve which Nepal FY a BS date string falls in. */
export function resolveBsYearStartFromBsDate(bsDate: string): number {
    const parsed = parseBsDateString(bsDate);
    if (!parsed) return getCurrentNepalFyStartYear();
    if (parsed.month >= SHRAWAN_MONTH) return parsed.year;
    return parsed.year - 1;
}

/** Resolve FY start year from AD date. */
export function resolveBsYearStartFromAdDate(adDate: Date): number {
    const bs = adToBs(adDate);
    return resolveBsYearStartFromBsDate(bs);
}

export function getCurrentNepalFyStartYear(): number {
    return resolveBsYearStartFromAdDate(new Date());
}

export function isDateInFiscalYear(adDate: Date, startAD: Date, endAD: Date): boolean {
    const t = adDate.getTime();
    return t >= startAD.getTime() && t <= endAD.getTime();
}

export function adDateToIsoDate(d: Date): string {
    return formatAdDateLocal(d);
}
