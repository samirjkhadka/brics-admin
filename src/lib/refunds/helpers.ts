import { RefundStatus } from "@prisma/client";

export type RefundTotals = {
    customerRefund: number;
    customerCash: number;
    supplierCredit: number;
};

export function sumRefundTotals(
    refunds: {
        customerRefundAmount: { toString(): string } | number;
        customerCashAmount: { toString(): string } | number;
        supplierCreditAmount: { toString(): string } | number;
    }[]
): RefundTotals {
    return refunds.reduce(
        (acc, r) => ({
            customerRefund: acc.customerRefund + Number(r.customerRefundAmount),
            customerCash: acc.customerCash + Number(r.customerCashAmount),
            supplierCredit: acc.supplierCredit + Number(r.supplierCreditAmount),
        }),
        { customerRefund: 0, customerCash: 0, supplierCredit: 0 }
    );
}

export function deriveRefundStatus(
    salesAmount: number,
    totals: RefundTotals
): RefundStatus {
    if (totals.customerRefund <= 0) return RefundStatus.NONE;
    if (totals.customerRefund >= salesAmount - 0.01) return RefundStatus.FULL;
    return RefundStatus.PARTIAL;
}

export function remainingCustomerRefund(salesAmount: number, refunded: number): number {
    return Math.max(0, salesAmount - refunded);
}

export function remainingSupplierCredit(purchaseAmount: number, credited: number): number {
    return Math.max(0, purchaseAmount - credited);
}

export function remainingCustomerCash(amountReceived: number, cashRefunded: number): number {
    return Math.max(0, amountReceived - cashRefunded);
}

export function defaultCustomerCashAmount(
    customerRefundAmount: number,
    amountReceived: number,
    priorCashRefunded: number
): number {
    const remainingCash = remainingCustomerCash(amountReceived, priorCashRefunded);
    return Math.min(customerRefundAmount, remainingCash);
}
