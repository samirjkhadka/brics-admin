import { describe, it, expect } from "vitest";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import {
    displayPaymentMethod,
    resolveReceivedStatusForSave,
} from "./payment-status";

describe("displayPaymentMethod", () => {
    it("hides payment method on unpaid bills", () => {
        expect(displayPaymentMethod(PaymentMethod.BANK, PaymentStatus.UNPAID)).toBeNull();
    });

    it("shows payment method when paid or partial", () => {
        expect(displayPaymentMethod(PaymentMethod.CASH, PaymentStatus.PAID)).toBe("CASH");
        expect(displayPaymentMethod(PaymentMethod.BANK, PaymentStatus.PARTIAL)).toBe("BANK");
    });
});

describe("resolveReceivedStatusForSave", () => {
    it("stores placeholder when no payment is recorded", () => {
        expect(resolveReceivedStatusForSave(undefined, 0, null)).toBe(PaymentMethod.BANK);
    });

    it("stores selected method when payment is recorded", () => {
        expect(resolveReceivedStatusForSave(PaymentMethod.QR, 1000, null)).toBe(
            PaymentMethod.QR
        );
    });
});
