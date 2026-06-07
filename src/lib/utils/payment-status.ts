import { PaymentMethod, PaymentStatus } from "@prisma/client";

export function derivePaymentStatus(
    salesAmount: number,
    amountReceived: number
): PaymentStatus {
    if (amountReceived <= 0) return PaymentStatus.UNPAID;
    if (amountReceived >= salesAmount) return PaymentStatus.PAID;
    return PaymentStatus.PARTIAL;
}

export function hasPaymentRecorded(
    amountReceived: number,
    receivedDate?: string | Date | null
): boolean {
    if (amountReceived > 0) return true;
    if (receivedDate) {
        if (receivedDate instanceof Date) return !Number.isNaN(receivedDate.getTime());
        return String(receivedDate).trim().length > 0;
    }
    return false;
}

/** Persist a payment method only when payment is recorded; otherwise a DB placeholder (hidden in UI). */
export function resolveReceivedStatusForSave(
    receivedStatus: PaymentMethod | string | null | undefined,
    amountReceived: number,
    receivedDate?: string | Date | null
): PaymentMethod {
    if (!hasPaymentRecorded(amountReceived, receivedDate)) {
        return PaymentMethod.BANK;
    }
    if (
        receivedStatus &&
        Object.values(PaymentMethod).includes(receivedStatus as PaymentMethod)
    ) {
        return receivedStatus as PaymentMethod;
    }
    return PaymentMethod.BANK;
}

/** Hide payment method on unpaid bills so UNPAID + BANK are not shown together. */
export function displayPaymentMethod(
    receivedStatus: PaymentMethod | string,
    paymentStatus: PaymentStatus | string
): string | null {
    if (paymentStatus === PaymentStatus.UNPAID) return null;
    return String(receivedStatus);
}
