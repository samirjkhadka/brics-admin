import { PaymentStatus } from "@prisma/client";

export function derivePaymentStatus(
    salesAmount: number,
    amountReceived: number
): PaymentStatus {
    if (amountReceived <= 0) return PaymentStatus.UNPAID;
    if (amountReceived >= salesAmount) return PaymentStatus.PAID;
    return PaymentStatus.PARTIAL;
}
