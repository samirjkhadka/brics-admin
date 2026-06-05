import { describe, it, expect } from "vitest";
import { PaymentMethod } from "@prisma/client";
import {
    mapRawRow,
    parseAndValidateRows,
    parseNprAmount,
    parseClientName,
    isSkippableRow,
} from "./parse-transaction-rows";

const LEGACY_ROW = {
    "Bill Date (BS)": "2083-02-01",
    "Bill Date (AD)": "2026-05-15",
    "Travel Date": "2026-05-19",
    "Purchase Invoice No": "SUM012454",
    "Purchase Amount": "Rs 13,000.00",
    "Sales Date": "2026-05-17",
    "Sales Bill No": "382",
    "Client Name": "NISHA GURUNG",
    PARTY: "SUJAN BASNET",
    Sector: "DEL-KTM",
    "Sale Amount": "Rs 13,000.00",
    "Segregate of Sales Amount as per Bill": "Rs 13,000.00",
    Exempt: "Rs 13,000.00",
    Taxable: "Rs 0.00",
    "Output VAT": "Rs 0.00",
};

describe("parse-transaction-rows", () => {
    it("parses NPR currency amounts", () => {
        expect(parseNprAmount("Rs 13,000.00")).toBe(13000);
        expect(parseNprAmount("Rs 0.00")).toBe(0);
        expect(parseNprAmount(67000)).toBe(67000);
    });

    it("parses legacy BRICS spreadsheet row", () => {
        const mapped = mapRawRow(LEGACY_ROW, 2);

        expect(mapped.salesBillNo).toBe("382");
        expect(mapped.partyName).toBe("SUJAN BASNET");
        expect(mapped.purchasePartyName).toBe("Unspecified");
        expect(mapped.purchaseDate).toBe("2026-05-15");
        expect(mapped.purchaseDateBS).toBe("2083-02-01");
        expect(mapped.salesDate).toBe("2026-05-17");
        expect(mapped.salesAmount).toBe(13000);
        expect(mapped.purchaseAmount).toBe(13000);
        expect(mapped.exemptAmount).toBe(13000);
        expect(mapped.sector).toBe("DEL-KTM");

        const passengers = JSON.parse(String(mapped.passengerNames));
        expect(passengers[0].name).toBe("NISHA GURUNG");
    });

    it("parses Client Name with * passenger count", () => {
        const json = parseClientName("KRAJWAL KC * 2");
        const passengers = JSON.parse(json);
        expect(passengers).toHaveLength(2);
        expect(passengers[0].name).toBe("KRAJWAL KC");
    });

    it("falls back to segregate amount when Sale Amount is empty", () => {
        const mapped = mapRawRow(
            {
                ...LEGACY_ROW,
                "Sales Bill No": "412",
                "Sale Amount": "",
                "Segregate of Sales Amount as per Bill": "Rs 263,007.00",
                Exempt: "Rs 263,007.00",
            },
            2
        );
        expect(mapped.salesAmount).toBe(263007);
    });

    it("converts BS sales date when Excel serial represents BS year", () => {
        const mapped = mapRawRow(
            {
                ...LEGACY_ROW,
                "Sales Bill No": "410",
                "Bill Date (BS)": "-",
                "Bill Date (AD)": "-",
                "Purchase Invoice No": "-",
                "Purchase Amount": "-",
                "Sales Date": 66992.23976851851,
            },
            2
        );
        expect(mapped.salesDate).toBeTruthy();
        expect(mapped.salesDateBS).toContain("2083");
    });

    it("maps extended template headers", () => {
        const mapped = mapRawRow(
            {
                "Sales Bill No": "BILL-200",
                "Party Name": "Customer Co",
                "Purchased From": "Supplier Co",
                Sector: "KTM-DEL",
                "Sales Date (AD)": "2025-06-01",
                "Purchase Invoice No": "PUR-200",
                "Purchase Amount": 40000,
                "Sales Amount": 60000,
                "Exempt Amt": 0,
                "Payment Via": "CHEQUE",
                "Cheque No": "CHQ-99",
                "Passenger Names": "Alice, Bob",
            },
            2
        );

        expect(mapped.purchasePartyName).toBe("Supplier Co");
        expect(mapped.receivedStatus).toBe(PaymentMethod.CHEQUE);
        expect(mapped.chequeNo).toBe("CHQ-99");
    });

    it("skips empty placeholder rows", () => {
        const mapped = mapRawRow(
            {
                "Sales Bill No": "415",
                PARTY: "",
                Sector: "",
                "Sale Amount": "",
                "Purchase Amount": "",
            },
            2
        );
        expect(isSkippableRow(mapped)).toBe(true);
    });

    it("validates legacy rows from a batch", () => {
        const { validRows, errors } = parseAndValidateRows([LEGACY_ROW, LEGACY_ROW]);
        expect(validRows.length).toBe(2);
        expect(errors).toHaveLength(0);
    });
});
