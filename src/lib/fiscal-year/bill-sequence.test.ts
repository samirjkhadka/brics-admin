import { describe, it, expect } from "vitest";
import {
    findNextAvailableBillSequence,
    findNextAvailableBillSequences,
} from "./bill-sequence";

describe("bill-sequence", () => {
    it("returns 1 when no bills exist", () => {
        expect(findNextAvailableBillSequence([])).toBe(1);
    });

    it("reuses a sequence freed by delete (gap in the middle)", () => {
        expect(findNextAvailableBillSequence([1, 3])).toBe(2);
    });

    it("reuses the latest deleted sequence", () => {
        expect(findNextAvailableBillSequence([1, 2])).toBe(3);
        expect(findNextAvailableBillSequence([1, 2, 3])).toBe(4);
        // Bill 148 deleted — only 147 remains
        expect(findNextAvailableBillSequence([147])).toBe(148);
    });

    it("does not reuse a voided bill sequence", () => {
        // 147 active, 148 voided (still in DB), 149 active → next is 150
        expect(findNextAvailableBillSequence([147, 148, 149])).toBe(150);
    });

    it("reserves multiple consecutive sequences for split bookings", () => {
        expect(findNextAvailableBillSequences([147, 150], 2)).toEqual([148, 149]);
    });
});
