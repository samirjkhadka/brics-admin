"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { adStringToBs } from "@/lib/utils/nepali-calendar";
import { toDecimal } from "@/lib/utils/decimal";
import { createRefundSchema } from "@/lib/validations/refund";
import {
    defaultCustomerCashAmount,
    deriveRefundStatus,
    remainingCustomerCash,
    remainingCustomerRefund,
    remainingSupplierCredit,
    sumRefundTotals,
} from "@/lib/refunds/helpers";

export async function createRefund(transactionId: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = createRefundSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    try {
        const tx = await db.transaction.findUnique({
            where: { id: transactionId },
            include: { refunds: true },
        });
        if (!tx) return { success: false, error: "Transaction not found" };
        if (tx.isVoided) return { success: false, error: "Cannot refund a voided transaction" };
        if (!tx.fiscalYearId) return { success: false, error: "Transaction has no fiscal year" };

        const prior = sumRefundTotals(tx.refunds);
        const salesAmount = Number(tx.salesAmount);
        const purchaseAmount = Number(tx.purchaseAmount);
        const amountReceived = Number(tx.amountReceived);

        const maxCustomerRefund = remainingCustomerRefund(salesAmount, prior.customerRefund);
        if (parsed.data.customerRefundAmount > maxCustomerRefund + 0.01) {
            return {
                success: false,
                error: `Customer refund cannot exceed remaining sales amount (${maxCustomerRefund.toFixed(2)})`,
            };
        }

        const customerCashAmount =
            parsed.data.customerCashAmount ??
            defaultCustomerCashAmount(
                parsed.data.customerRefundAmount,
                amountReceived,
                prior.customerCash
            );

        const maxCash = remainingCustomerCash(amountReceived, prior.customerCash);
        if (customerCashAmount > maxCash + 0.01) {
            return {
                success: false,
                error: `Cash refund cannot exceed amount received (${maxCash.toFixed(2)})`,
            };
        }
        if (customerCashAmount > parsed.data.customerRefundAmount + 0.01) {
            return { success: false, error: "Cash refund cannot exceed customer refund amount" };
        }

        const supplierCreditAmount = parsed.data.supplierCreditAmount ?? 0;
        if (supplierCreditAmount > 0) {
            const maxSupplier = remainingSupplierCredit(purchaseAmount, prior.supplierCredit);
            if (supplierCreditAmount > maxSupplier + 0.01) {
                return {
                    success: false,
                    error: `Supplier credit cannot exceed remaining purchase amount (${maxSupplier.toFixed(2)})`,
                };
            }
        }

        const refundDateAD = new Date(parsed.data.refundDate);
        const refundDateBS = adStringToBs(parsed.data.refundDate);

        const refund = await db.refund.create({
            data: {
                transactionId,
                fiscalYearId: tx.fiscalYearId,
                refundType: parsed.data.refundType,
                customerRefundAmount: toDecimal(parsed.data.customerRefundAmount),
                customerCashAmount: toDecimal(customerCashAmount),
                supplierCreditAmount: toDecimal(supplierCreditAmount),
                supplierCreditNoteNo: parsed.data.supplierCreditNoteNo?.trim() || null,
                refundDateAD,
                refundDateBS,
                paymentMethod: customerCashAmount > 0 ? parsed.data.paymentMethod : null,
                paymentReference: parsed.data.paymentReference?.trim() || null,
                remarks: parsed.data.remarks?.trim() || null,
            },
        });

        const allRefunds = [...tx.refunds, refund];
        const totals = sumRefundTotals(allRefunds);
        const refundStatus = deriveRefundStatus(salesAmount, totals);

        await db.transaction.update({
            where: { id: transactionId },
            data: { refundStatus },
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "REFUND_TX",
            entityType: "Refund",
            entityId: refund.id,
            metadata: {
                transactionId,
                salesBillNo: tx.salesBillNo,
                refundType: parsed.data.refundType,
                customerRefundAmount: parsed.data.customerRefundAmount,
                supplierCreditAmount,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath(`/dashboard/tickets/${transactionId}`);
        revalidatePath("/dashboard/reports/statements");
        revalidatePath("/dashboard/reports/balance-confirmation");

        return { success: true, data: refund };
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to create refund";
        return { success: false, error: message };
    }
}
