"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { allocateNextReceiptNo } from "@/lib/fiscal-year/service";
import { adStringToBs } from "@/lib/utils/nepali-calendar";
import { toDecimal } from "@/lib/utils/decimal";
import { derivePaymentStatus } from "@/lib/utils/payment-status";

export async function issueReceiptForTransaction(transactionId: string) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const tx = await db.transaction.findUnique({ where: { id: transactionId } });
    if (!tx) return { success: false, error: "Transaction not found" };
    if (tx.isVoided) return { success: false, error: "Cannot issue receipt for voided bill" };
    if (!tx.fiscalYearId) return { success: false, error: "Transaction has no fiscal year" };

    const existing = await db.paymentReceipt.findFirst({
        where: { transactionId },
    });
    if (existing) return { success: false, error: "Receipt already issued", data: existing };

    const amount = Number(tx.amountReceived) > 0 ? Number(tx.amountReceived) : Number(tx.salesAmount);
    const receiptDateAD = tx.receivedDate || new Date();
    const receiptNo = await allocateNextReceiptNo(tx.fiscalYearId);

    const partner = await db.partner.findFirst({
        where: { name: tx.partyName, type: "CUSTOMER" },
    });

    const receipt = await db.paymentReceipt.create({
        data: {
            receiptNo,
            fiscalYearId: tx.fiscalYearId,
            transactionId: tx.id,
            partnerId: partner?.id || null,
            partyName: tx.partyName,
            amount: toDecimal(amount),
            paymentMethod: tx.receivedStatus,
            chequeNo: tx.chequeNo,
            receiptDateAD,
            receiptDateBS: adStringToBs(receiptDateAD.toISOString().split("T")[0]),
            allocations: {
                create: {
                    transactionId: tx.id,
                    amount: toDecimal(amount),
                },
            },
        },
    });

    await db.transaction.update({
        where: { id: tx.id },
        data: {
            receiptNo: receipt.receiptNo,
            amountReceived: toDecimal(amount),
            paymentStatus: derivePaymentStatus(Number(tx.salesAmount), amount),
        },
    });

    await writeAuditLog({
        userId: auth.session.user.id,
        userName: auth.session.user.name,
        action: "ISSUE_RECEIPT",
        entityType: "PaymentReceipt",
        entityId: receipt.id,
        metadata: { transactionId, receiptNo },
    });

    revalidatePath(`/dashboard/tickets/${transactionId}`);
    revalidatePath("/dashboard/tickets");

    return { success: true, data: receipt };
}
