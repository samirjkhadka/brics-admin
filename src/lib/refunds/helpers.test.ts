import { describe, it, expect } from "vitest";
import {
    deriveRefundStatus,
    defaultCustomerCashAmount,
    sumRefundTotals,
} from "./helpers";
import { RefundStatus } from "@prisma/client";

describe("refund helpers", () => {
    it("derives refund status from totals", () => {
        expect(deriveRefundStatus(50000, { customerRefund: 0, customerCash: 0, supplierCredit: 0 })).toBe(
            RefundStatus.NONE
        );
        expect(deriveRefundStatus(50000, { customerRefund: 25000, customerCash: 25000, supplierCredit: 0 })).toBe(
            RefundStatus.PARTIAL
        );
        expect(deriveRefundStatus(50000, { customerRefund: 50000, customerCash: 20000, supplierCredit: 45000 })).toBe(
            RefundStatus.FULL
        );
    });

    it("defaults cash refund to min of refund and remaining received", () => {
        expect(defaultCustomerCashAmount(50000, 20000, 0)).toBe(20000);
        expect(defaultCustomerCashAmount(10000, 20000, 5000)).toBe(10000);
        expect(defaultCustomerCashAmount(50000, 0, 0)).toBe(0);
    });

    it("sums refund totals", () => {
        const totals = sumRefundTotals([
            { customerRefundAmount: 10000, customerCashAmount: 5000, supplierCreditAmount: 8000 },
            { customerRefundAmount: 5000, customerCashAmount: 0, supplierCreditAmount: 2000 },
        ]);
        expect(totals).toEqual({
            customerRefund: 15000,
            customerCash: 5000,
            supplierCredit: 10000,
        });
    });
});
