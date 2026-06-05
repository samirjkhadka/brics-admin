import { describe, it, expect } from "vitest";
import {
    formatBillNo,
    formatReceiptNo,
    buildFiscalYearLabel,
    getBillPrefixYear,
    getFiscalYearBounds,
    resolveBsYearStartFromBsDate,
} from "./nepal-fy";

describe("nepal-fy", () => {
    it("formats bill numbers with BS year prefix and 3-digit sequence", () => {
        expect(formatBillNo(2083, 1)).toBe("2083-001");
        expect(formatBillNo(2083, 42)).toBe("2083-042");
        expect(formatBillNo(2084, 100)).toBe("2084-100");
    });

    it("formats receipt numbers", () => {
        expect(formatReceiptNo(2083, 1)).toBe("R-2083-001");
    });

    it("builds FY label", () => {
        expect(buildFiscalYearLabel(2082)).toBe("2082/83");
    });

    it("bill prefix year is start + 1", () => {
        expect(getBillPrefixYear(2082)).toBe(2083);
    });

    it("resolves FY from Shrawan vs pre-Shrawan BS dates", () => {
        expect(resolveBsYearStartFromBsDate("2082-04-01")).toBe(2082);
        expect(resolveBsYearStartFromBsDate("2083-03-15")).toBe(2082);
    });

    it("FY bounds span Shrawan 1 to Ashad end", () => {
        const bounds = getFiscalYearBounds(2082);
        expect(bounds.label).toBe("2082/83");
        expect(bounds.billPrefixYear).toBe(2083);
        expect(bounds.startDateBS).toBe("2082-04-01");
        expect(bounds.startDateAD.getTime()).toBeLessThan(bounds.endDateAD.getTime());
    });
});
