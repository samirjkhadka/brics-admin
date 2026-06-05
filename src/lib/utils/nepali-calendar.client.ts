"use client";

import { getClientNepaliFunctions } from "@/lib/nepali/sajanm-functions";
import {
    coreAdStringToBs,
    coreAdToBs,
    coreBsStringToAd,
    coreBsToAd,
    coreFormatAdDateLocal,
    coreFormatBsDate,
    coreGetBsMonthDays,
    coreGetTodayBs,
    coreParseBsDateString,
} from "@/lib/nepali/convert-core";

function NF() {
    return getClientNepaliFunctions();
}

export function adStringToBs(ad: string): string {
    return coreAdStringToBs(NF(), ad);
}

export function bsStringToAd(bs: string): string {
    return coreBsStringToAd(NF(), bs);
}

export function adToBs(adDate: Date): string {
    return coreAdToBs(NF(), adDate);
}

export function bsToAd(bsDateStr: string): Date {
    return coreBsToAd(NF(), bsDateStr);
}

export function formatBsDate(year: number, month: number, day: number): string {
    return coreFormatBsDate(NF(), year, month, day);
}

export function parseBsDateString(str: string) {
    return coreParseBsDateString(NF(), str);
}

export function formatAdDateLocal(date: Date): string {
    return coreFormatAdDateLocal(date);
}

export function getTodayBs() {
    return coreGetTodayBs(NF());
}

export function getBsMonthDays(year: number, month: number): number {
    return coreGetBsMonthDays(NF(), year, month);
}
