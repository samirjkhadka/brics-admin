import { describe, it, expect } from "vitest";
import { calculateTax } from "./calculations";

describe("calculateTax", () => {
    it("calculates VAT for sales with no exempt amount", () => {
        const result = calculateTax(11300, 0);
        expect(result.taxableAmount).toBe(10000);
        expect(result.vatAmount).toBe(1300);
    });

    it("calculates VAT with exempt amount", () => {
        const result = calculateTax(73500, 3500);
        expect(result.taxableAmount).toBe(61946.9);
        expect(result.vatAmount).toBe(8053.1);
    });

    it("returns zero VAT when sales equals exempt", () => {
        const result = calculateTax(5000, 5000);
        expect(result.taxableAmount).toBe(0);
        expect(result.vatAmount).toBe(0);
    });
});
