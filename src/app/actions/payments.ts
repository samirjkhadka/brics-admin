"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod, Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { allocateNextReceiptNo } from "@/lib/fiscal-year/service";
import { adStringToBs } from "@/lib/utils/nepali-calendar";
import { toDecimal } from "@/lib/utils/decimal";
import { derivePaymentStatus } from "@/lib/utils/payment-status";

const bulkPaymentSchema = z.object({
    transactionIds: z.array(z.string()).min(1, "Select at least one transaction"),
    receivedStatus: z.nativeEnum(PaymentMethod),
    receivedDate: z.string().min(1, "Receipt date is required"),
    amountReceived: z.coerce.number().positive("Amount must be greater than zero"),
    chequeNo: z.string().optional().nullable(),
    issueReceipt: z.boolean().default(true),
    receiptNo: z.string().optional().nullable(),
});

export async function bulkRecordPayment(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = bulkPaymentSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const { transactionIds, receivedStatus, receivedDate, amountReceived, chequeNo, issueReceipt } =
        parsed.data;

    try {
        const transactions = await db.transaction.findMany({
            where: { id: { in: transactionIds } },
        });

        if (transactions.length !== transactionIds.length) {
            return { success: false, error: "One or more transactions not found" };
        }

        const voided = transactions.filter((t) => t.isVoided);
        if (voided.length > 0) {
            return { success: false, error: "Cannot pay voided transactions" };
        }

        const parties = new Set(transactions.map((t) => t.partyName.trim().toLowerCase()));
        if (parties.size > 1) {
            return { success: false, error: "All selected tickets must belong to the same customer (party)" };
        }

        const partyName = transactions[0].partyName;
        const fiscalYearId = transactions[0].fiscalYearId;
        if (!fiscalYearId) {
            return { success: false, error: "Transactions must have a fiscal year assigned" };
        }

        const totalDue = transactions.reduce(
            (sum, t) => sum + Number(t.salesAmount) - Number(t.amountReceived),
            0
        );

        if (amountReceived > totalDue + 0.01) {
            return { success: false, error: `Amount exceeds outstanding balance (${totalDue.toFixed(2)})` };
        }

        const receiptDateAD = new Date(receivedDate);
        const receiptDateBS = adStringToBs(receivedDate);

        let remaining = amountReceived;
        const allocations: { transactionId: string; amount: number }[] = [];

        for (const tx of transactions) {
            const outstanding = Number(tx.salesAmount) - Number(tx.amountReceived);
            if (outstanding <= 0) continue;
            const alloc = Math.min(outstanding, remaining);
            if (alloc <= 0) break;
            allocations.push({ transactionId: tx.id, amount: alloc });
            remaining -= alloc;
        }

        if (allocations.length === 0) {
            return { success: false, error: "No outstanding balance on selected tickets" };
        }

        const partner = await db.partner.findFirst({
            where: { name: partyName, type: "CUSTOMER" },
        });

        let receiptId: string | null = null;
        let receiptNo: string | null = null;

        if (issueReceipt) {
            receiptNo = await allocateNextReceiptNo(fiscalYearId);
            const receipt = await db.paymentReceipt.create({
                data: {
                    receiptNo,
                    fiscalYearId,
                    transactionId: allocations.length === 1 ? allocations[0].transactionId : null,
                    partnerId: partner?.id || null,
                    partyName,
                    amount: toDecimal(amountReceived),
                    paymentMethod: receivedStatus,
                    chequeNo: chequeNo || null,
                    receiptDateAD,
                    receiptDateBS,
                    allocations: {
                        create: allocations.map((a) => ({
                            transactionId: a.transactionId,
                            amount: toDecimal(a.amount),
                        })),
                    },
                },
            });
            receiptId = receipt.id;
        }

        for (const alloc of allocations) {
            const tx = transactions.find((t) => t.id === alloc.transactionId)!;
            const newReceived = Number(tx.amountReceived) + alloc.amount;
            await db.transaction.update({
                where: { id: alloc.transactionId },
                data: {
                    receivedStatus,
                    receivedDate: receiptDateAD,
                    chequeNo: chequeNo || tx.chequeNo,
                    amountReceived: toDecimal(newReceived),
                    paymentStatus: derivePaymentStatus(Number(tx.salesAmount), newReceived),
                    receiptNo: receiptNo || tx.receiptNo,
                },
            });
        }

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: issueReceipt ? "BULK_PAYMENT_RECEIPT" : "BULK_MARK_PAID",
            entityType: "Transaction",
            entityId: transactionIds.join(","),
            metadata: {
                partyName,
                amountReceived,
                receiptNo,
                receiptId,
                transactionIds,
            },
        });

        revalidatePath("/dashboard/tickets");
        revalidatePath("/dashboard/reports/balance-confirmation");

        return {
            success: true,
            data: {
                receiptNo,
                receiptId,
                partyName,
                amountReceived,
                transactionsUpdated: allocations.length,
            },
        };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to record payment";
        return { success: false, error: message };
    }
}
