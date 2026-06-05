import { describe, it, expect } from "vitest";
import { isPurchasePartyUnset } from "./purchase-party";

describe("isPurchasePartyUnset", () => {
    it("flags placeholder and empty values", () => {
        expect(isPurchasePartyUnset("")).toBe(true);
        expect(isPurchasePartyUnset("Unspecified")).toBe(true);
        expect(isPurchasePartyUnset("  not specified  ")).toBe(true);
    });

    it("accepts a real supplier name", () => {
        expect(isPurchasePartyUnset("Air Arabia GSA")).toBe(false);
    });
});
