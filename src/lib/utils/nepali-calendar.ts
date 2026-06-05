import { getServerNepaliFunctions } from "@/lib/nepali/sajanm-server";
import {
    coreAdStringToBs,
    coreBsStringToAd,
    coreFormatAdDateLocal,
    coreFormatBsDate,
    coreGetBsCalendarGrid,
    coreGetBsMonthDays,
    coreGetBsMonthName,
    coreGetTodayBs,
    coreParseBsDateString,
} from "@/lib/nepali/convert-core";
import { coreAdToBs, coreBsToAd } from "@/lib/nepali/convert-core";

import { BS_MONTH_NAMES, getBsMonthName as staticMonthName } from "@/lib/nepali/month-names";

export { BS_MONTH_NAMES };

function NF() {
    return getServerNepaliFunctions();
}

export function getBsMonthName(month: number): string {
    return coreGetBsMonthName(NF(), month) || staticMonthName(month);
}

export function formatBsDate(year: number, month: number, day: number): string {
    return coreFormatBsDate(NF(), year, month, day);
}

export function parseBsDateString(str: string): { year: number; month: number; day: number } | null {
    return coreParseBsDateString(NF(), str);
}

export function getBsMonthDays(year: number, month: number): number {
    return coreGetBsMonthDays(NF(), year, month);
}

export function getBsCalendarGrid(year: number, month: number): (number | null)[][] {
    return coreGetBsCalendarGrid(NF(), year, month);
}

export function adStringToBs(ad: string): string {
    return coreAdStringToBs(NF(), ad);
}

export function formatAdDateLocal(date: Date): string {
    return coreFormatAdDateLocal(date);
}

export function bsStringToAd(bs: string): string {
    return coreBsStringToAd(NF(), bs);
}

export function getTodayBs(): { year: number; month: number; day: number } {
    return coreGetTodayBs(NF());
}

export function adToBs(adDate: Date): string {
    return coreAdToBs(NF(), adDate);
}

export function bsToAd(bsDateStr: string): Date {
    return coreBsToAd(NF(), bsDateStr);
}
