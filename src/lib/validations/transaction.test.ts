import { describe, it, expect } from "vitest";
import { PaymentMethod } from "@prisma/client";
import { transactionSchema } from "./transaction";

const validBase = {
    passengerNames: JSON.stringify([{ name: "Test User", ticketNo: "" }]),
    partyName: "Test Party",
    purchasePartyName: "Test Supplier",
    sector: "KTM-DXB",
    salesBillNo: "BILL-100",
    salesDate: "2025-06-01",
    salesDateBS: "2082-02-19",
    purchaseInvoiceNo: "PUR-100",
    purchaseAmount: 50000,
    salesAmount: 73500,
    exemptAmount: 0,
    receivedStatus: PaymentMethod.BANK,
};

describe("transactionSchema", () => {
    it("accepts valid transaction input", () => {
        const result = transactionSchema.safeParse(validBase);
        expect(result.success).toBe(true);
    });

    it("rejects negative purchase amount", () => {
        const result = transactionSchema.safeParse({ ...validBase, purchaseAmount: -1 });
        expect(result.success).toBe(false);
    });

    it("accepts negative exempt amount", () => {
        const result = transactionSchema.safeParse({ ...validBase, exemptAmount: -5000 });
        expect(result.success).toBe(true);
    });

    it("rejects exempt amount greater than sales", () => {
        const result = transactionSchema.safeParse({ ...validBase, exemptAmount: 80000 });
        expect(result.success).toBe(false);
    });

    it("requires purchasePartyName", () => {
        const result = transactionSchema.safeParse({ ...validBase, purchasePartyName: "" });
        expect(result.success).toBe(false);
    });

    it("requires chequeNo when payment is CHEQUE and payment is recorded", () => {
        const result = transactionSchema.safeParse({
            ...validBase,
            receivedStatus: PaymentMethod.CHEQUE,
            amountReceived: 1000,
            chequeNo: "",
        });
        expect(result.success).toBe(false);
    });

    it("accepts CHEQUE payment with cheque number", () => {
        const result = transactionSchema.safeParse({
            ...validBase,
            receivedStatus: PaymentMethod.CHEQUE,
            amountReceived: 1000,
            chequeNo: "CHQ-12345",
        });
        expect(result.success).toBe(true);
    });

    it("rejects sales date before purchase date", () => {
        const result = transactionSchema.safeParse({
            ...validBase,
            purchaseDate: "2025-06-10",
            salesDate: "2025-06-01",
        });
        expect(result.success).toBe(false);
    });

    it("accepts sales date on same day as purchase date", () => {
        const result = transactionSchema.safeParse({
            ...validBase,
            purchaseDate: "2025-06-01",
            salesDate: "2025-06-01",
        });
        expect(result.success).toBe(true);
    });
});
