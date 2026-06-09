import { describe, it, expect } from "vitest";
import { formatDisplayDate } from "./format-display-date";

describe("formatDisplayDate", () => {
    it("formats dates as YYYY-MM-DD", () => {
        expect(formatDisplayDate(new Date(2026, 5, 5))).toBe("2026-06-05");
    });

    it("returns fallback for null", () => {
        expect(formatDisplayDate(null)).toBe("—");
        expect(formatDisplayDate(null, "N/A")).toBe("N/A");
    });
});
