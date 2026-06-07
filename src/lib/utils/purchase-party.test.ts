import { describe, it, expect } from "vitest";
import {
    formatPurchasedFromLabel,
    isOwnSalesBill,
    isPurchasePartyUnset,
} from "./purchase-party";

describe("isPurchasePartyUnset", () => {
    it("flags placeholder and empty values", () => {
        expect(isPurchasePartyUnset("")).toBe(true);
        expect(isPurchasePartyUnset("Unspecified")).toBe(true);
        expect(isPurchasePartyUnset("  not specified  ")).toBe(true);
    });

    it("accepts a real supplier name", () => {
        expect(isPurchasePartyUnset("Air Arabia GSA")).toBe(false);
    });

    it("accepts Own as a valid purchase source", () => {
        expect(isPurchasePartyUnset("Own")).toBe(false);
    });
});

describe("isOwnSalesBill", () => {
    it("detects sales-only bills", () => {
        expect(isOwnSalesBill({ purchaseInvoiceNo: "", purchaseAmount: 0 })).toBe(true);
        expect(isOwnSalesBill({ purchaseInvoiceNo: "INV-1", purchaseAmount: 1000 })).toBe(
            false
        );
    });
});

describe("formatPurchasedFromLabel", () => {
    it("returns Own for sales-only bills", () => {
        expect(
            formatPurchasedFromLabel({
                purchasePartyName: "",
                purchaseInvoiceNo: "",
                purchaseAmount: 0,
            })
        ).toBe("Own");
    });

    it("returns No supplier when purchase exists but supplier is missing", () => {
        expect(
            formatPurchasedFromLabel({
                purchasePartyName: "",
                purchaseInvoiceNo: "PI-100",
                purchaseAmount: 5000,
            })
        ).toBe("No supplier");
    });
});
