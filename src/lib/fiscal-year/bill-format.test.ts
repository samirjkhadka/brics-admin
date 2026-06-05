import { describe, it, expect } from "vitest";
import { formatFromTemplate, validateBillFormat } from "./bill-format";

describe("bill-format", () => {
    it("formats default year-seq pattern", () => {
        expect(formatFromTemplate("{year}-{seq:3}", 2083, 1)).toBe("2083-001");
        expect(formatFromTemplate("{year}-{seq:3}", 2083, 42)).toBe("2083-042");
    });

    it("formats receipt and custom prefixes", () => {
        expect(formatFromTemplate("R-{year}-{seq:3}", 2083, 1)).toBe("R-2083-001");
        expect(formatFromTemplate("BRICS-{year}-{seq:3}", 2083, 5)).toBe("BRICS-2083-005");
    });

    it("formats seq-only pattern", () => {
        expect(formatFromTemplate("{seq:3}", 2083, 1)).toBe("001");
    });

    it("validates templates require sequence token", () => {
        expect(validateBillFormat("{year}-only")).toContain("seq");
        expect(validateBillFormat("{year}-{seq:3}")).toBeNull();
    });
});
