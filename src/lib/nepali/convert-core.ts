import type { NepaliDateObject, SajanmNepaliFunctions } from "./sajanm-functions";
import { isNepaliDateObject } from "./sajanm-functions";

const BS_FORMAT = "YYYY-MM-DD";
const AD_FORMAT = "YYYY-MM-DD";

function adPartsFromDate(adDate: Date): NepaliDateObject {
    return {
        year: adDate.getFullYear(),
        month: adDate.getMonth() + 1,
        day: adDate.getDate(),
    };
}

function adObjectToDate(ad: NepaliDateObject): Date {
    return new Date(ad.year, ad.month - 1, ad.day);
}

export function coreBsToAd(NF: SajanmNepaliFunctions, bsDateStr: string): Date {
    const normalized = bsDateStr.trim().replace(/\//g, "-");
    const match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (!match) {
        throw new Error(`Invalid BS date: ${bsDateStr}`);
    }
    const ad = NF.BS2AD(normalized, BS_FORMAT);
    if (!ad) {
        throw new Error(`Invalid BS date: ${bsDateStr}`);
    }
    if (typeof ad === "string") {
        const parsed = NF.ConvertToDateObject(ad, AD_FORMAT);
        if (!parsed) throw new Error(`Invalid BS date: ${bsDateStr}`);
        return adObjectToDate(parsed);
    }
    return adObjectToDate(ad);
}

export function coreAdToBs(NF: SajanmNepaliFunctions, adDate: Date): string {
    const parts = adPartsFromDate(adDate);
    const bs = NF.AD2BS(parts, AD_FORMAT, BS_FORMAT);
    if (!bs) return "";
    if (typeof bs === "string") return bs;
    if (isNepaliDateObject(bs)) {
        return NF.ConvertToDateFormat(bs, BS_FORMAT);
    }
    return "";
}

export function coreAdStringToBs(NF: SajanmNepaliFunctions, ad: string): string {
    if (!ad) return "";
    const [y, m, d] = ad.split("-").map((v) => parseInt(v, 10));
    if (!y || !m || !d) return "";
    const bs = NF.AD2BS({ year: y, month: m, day: d }, AD_FORMAT, BS_FORMAT);
    if (!bs) return "";
    if (typeof bs === "string") return bs;
    if (isNepaliDateObject(bs)) return NF.ConvertToDateFormat(bs, BS_FORMAT);
    return "";
}

export function coreFormatBsDate(NF: SajanmNepaliFunctions, year: number, month: number, day: number): string {
    return NF.ConvertToDateFormat({ year, month, day }, BS_FORMAT);
}

export function coreParseBsDateString(
    NF: SajanmNepaliFunctions,
    str: string
): NepaliDateObject | null {
    const normalized = str.trim();
    if (!normalized) return null;
    const parsed = NF.ConvertToDateObject(normalized, BS_FORMAT);
    if (!parsed || !NF.BS.ValidateDate(parsed, BS_FORMAT)) return null;
    return parsed;
}

export function coreFormatAdDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

export function coreBsStringToAd(NF: SajanmNepaliFunctions, bs: string): string {
    const parsed = coreParseBsDateString(NF, bs);
    if (!parsed) return "";
    try {
        const date = coreBsToAd(NF, coreFormatBsDate(NF, parsed.year, parsed.month, parsed.day));
        return coreFormatAdDateLocal(date);
    } catch {
        return "";
    }
}

export function coreGetBsMonthDays(NF: SajanmNepaliFunctions, year: number, month: number): number {
    return NF.BS.GetDaysInMonth(year, month);
}

export function coreGetBsMonthName(NF: SajanmNepaliFunctions, month: number): string {
    return NF.BS.GetMonth(month - 1) || "";
}

export function coreGetTodayBs(NF: SajanmNepaliFunctions): NepaliDateObject {
    const today = NF.BS.GetCurrentDate();
    if (typeof today === "string") {
        const parsed = coreParseBsDateString(NF, today);
        return parsed || { year: 2082, month: 1, day: 1 };
    }
    return today;
}

export function coreGetBsCalendarGrid(
    NF: SajanmNepaliFunctions,
    year: number,
    month: number
): (number | null)[][] {
    const daysInMonth = coreGetBsMonthDays(NF, year, month);
    const weekdayName = NF.BS.GetFullDay({ year, month, day: 1 }, BS_FORMAT);
    const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const firstWeekday = weekdayName ? weekdays.indexOf(weekdayName) : 0;
    const cells: (number | null)[] = [];

    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    while (cells.length % 7 !== 0) cells.push(null);

    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
        weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
}
