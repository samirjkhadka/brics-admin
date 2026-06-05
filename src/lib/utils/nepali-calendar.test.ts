import { describe, it, expect } from "vitest";
import {
    formatBsDate,
    parseBsDateString,
    getBsMonthDays,
    adStringToBs,
    bsStringToAd,
} from "./nepali-calendar";

describe("nepali-calendar (sajanm)", () => {
    it("formats BS date as YYYY-MM-DD", () => {
        expect(formatBsDate(2082, 2, 19)).toBe("2082-02-19");
    });

    it("parses BS date string", () => {
        expect(parseBsDateString("2082-02-19")).toEqual({ year: 2082, month: 2, day: 19 });
        expect(parseBsDateString("invalid")).toBeNull();
    });

    it("round-trips AD and BS for 2025-06-05", () => {
        const bs = adStringToBs("2025-06-05");
        expect(bs).toBe("2082-02-22");
        const ad = bsStringToAd(bs);
        expect(ad).toBe("2025-06-05");
    });

    it("returns correct variable day counts for BS 2082", () => {
        expect(getBsMonthDays(2082, 1)).toBe(31);
        expect(getBsMonthDays(2082, 2)).toBe(31);
        expect(getBsMonthDays(2082, 3)).toBe(32);
        expect(getBsMonthDays(2082, 9)).toBe(30);
    });
});
