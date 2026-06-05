import { describe, it, expect } from "vitest";
import {
    parsePassengers,
    formatPassengerNames,
    shouldUseCompactPassengerDisplay,
    formatCompactPassengerDisplay,
    formatInvoiceGuestLine,
} from "./parse-passengers";

describe("parsePassengers", () => {
    it("parses JSON array of passengers", () => {
        const raw = JSON.stringify([
            { name: "John Doe", ticketNo: "TK001" },
            { name: "Jane Smith", ticketNo: "TK002" },
        ]);
        const result = parsePassengers(raw);
        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("John Doe");
        expect(result[1].ticketNo).toBe("TK002");
    });

    it("falls back to legacy plain string", () => {
        const result = parsePassengers("John Doe, Jane Smith");
        expect(result).toEqual([{ name: "John Doe, Jane Smith", ticketNo: "" }]);
    });

    it("returns empty array for empty input", () => {
        expect(parsePassengers("")).toEqual([]);
    });
});

describe("formatPassengerNames", () => {
    it("joins passenger names", () => {
        const raw = JSON.stringify([{ name: "Alice", ticketNo: "" }, { name: "Bob", ticketNo: "" }]);
        expect(formatPassengerNames(raw)).toBe("Alice, Bob");
    });
});

describe("invoice passenger display", () => {
    const threePax = parsePassengers(
        JSON.stringify([
            { name: "DEU BIR BANTHA MAGAR", ticketNo: "1" },
            { name: "JANE DOE", ticketNo: "2" },
            { name: "JOHN DOE", ticketNo: "3" },
        ])
    );

    it("uses compact display when more than three passengers", () => {
        const fourPax = [...threePax, { name: "EXTRA", ticketNo: "4" }];
        expect(shouldUseCompactPassengerDisplay(fourPax)).toBe(true);
        expect(formatCompactPassengerDisplay(fourPax)).toBe("DEU BIR BANTHA MAGAR x 4");
    });

    it("lists up to three passengers in full", () => {
        expect(shouldUseCompactPassengerDisplay(threePax)).toBe(false);
        expect(formatInvoiceGuestLine(threePax, "")).toBe(
            "DEU BIR BANTHA MAGAR, JANE DOE, JOHN DOE"
        );
    });

    it("formats single passenger without x count", () => {
        const one = [{ name: "DEU BIR BANTHA MAGAR", ticketNo: "" }];
        expect(formatInvoiceGuestLine(one, "")).toBe("DEU BIR BANTHA MAGAR");
        expect(formatCompactPassengerDisplay(one)).toBe("DEU BIR BANTHA MAGAR");
    });
});
