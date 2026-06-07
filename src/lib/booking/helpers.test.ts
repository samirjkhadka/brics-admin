import { describe, it, expect } from "vitest";
import {
    joinSectors,
    allocateLineSalesAmounts,
    buildInvoiceLineItems,
    summarizePurchaseInvoices,
} from "./helpers";

describe("booking helpers", () => {
    it("joins sectors from legs without duplicate connection airports", () => {
        expect(joinSectors([{ sector: "KTM-BOM" }, { sector: "BOM-CAO-LCA" }])).toBe(
            "KTM-BOM-CAO-LCA"
        );
    });

    it("summarizes multiple purchase invoices", () => {
        expect(
            summarizePurchaseInvoices([
                { purchaseInvoiceNo: "SI-1" },
                { purchaseInvoiceNo: "SI-2" },
            ])
        ).toBe("SI-1 + 1 more");
    });

    it("allocates line sales proportionally by purchase amount", () => {
        const amounts = allocateLineSalesAmounts(
            [
                { purchaseAmount: 60000 },
                { purchaseAmount: 40000 },
            ],
            100000
        );
        expect(amounts[0]).toBe(60000);
        expect(amounts[1]).toBe(40000);
    });

    it("builds invoice line items with per-line tax formula", () => {
        const lines = buildInvoiceLineItems(
            [
                { sector: "KTM-BOM", lineSalesAmount: 60000 },
                { sector: "BOM-LCA", lineSalesAmount: 40000 },
            ],
            0
        );
        expect(lines).toHaveLength(2);
        expect(lines[0].sector).toBe("KTM-BOM");
        expect(lines[1].sector).toBe("BOM-LCA");
        expect(lines[0].exemptAmount).toBe(0);
        expect(lines[0].taxableAmount).toBeCloseTo((60000 * 100) / 113, 2);
        expect(lines[1].taxableAmount).toBeCloseTo((40000 * 100) / 113, 2);
        expect(lines[0].vatAmount).toBeCloseTo(((60000 * 100) / 113) * 0.13, 1);
    });

    it("allocates exempt to non-taxable column per line", () => {
        const lines = buildInvoiceLineItems(
            [
                { sector: "KTM-DEL", lineSalesAmount: 113000 },
            ],
            13000
        );
        expect(lines[0].exemptAmount).toBe(13000);
        expect(lines[0].taxableAmount).toBeCloseTo(((113000 - 13000) * 100) / 113, 2);
    });

    it("uses per-leg exempt amounts when stored on legs", () => {
        const lines = buildInvoiceLineItems(
            [
                { sector: "KTM-BOM", lineSalesAmount: 31000, exemptAmount: 3488.54 },
                { sector: "BOM-CAI-LCA", lineSalesAmount: 74000, exemptAmount: 71000 },
            ],
            74488.54
        );
        expect(lines[0].exemptAmount).toBe(3488.54);
        expect(lines[1].exemptAmount).toBe(71000);
        expect(lines[0].taxableAmount).toBeCloseTo(((31000 - 3488.54) * 100) / 113, 2);
        expect(lines[1].taxableAmount).toBeCloseTo(((74000 - 71000) * 100) / 113, 2);
        expect(lines[1].vatAmount).toBeCloseTo(345.13, 1);
    });
});
