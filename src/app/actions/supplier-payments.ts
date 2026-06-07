"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PaymentMethod, PartnerType, Role } from "@prisma/client";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { publicErrorMessage } from "@/lib/security/sanitize-error";
import { writeAuditLog } from "@/lib/audit/log";
import { adStringToBs } from "@/lib/utils/nepali-calendar";
import { toDecimal } from "@/lib/utils/decimal";
import { getSupplierStatement } from "@/lib/ledger/party-ledger";

const supplierPaymentSchema = z
    .object({
        fiscalYearId: z.string().min(1),
        supplierName: z.string().min(1, "Supplier is required"),
        amount: z.coerce.number().positive("Amount must be greater than zero"),
        paymentMethod: z.nativeEnum(PaymentMethod),
        paymentDate: z.string().min(1, "Payment date is required"),
        chequeNo: z.string().optional().nullable(),
        paymentReference: z.string().optional().nullable(),
        remarks: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
        if (
            data.paymentMethod === PaymentMethod.CHEQUE &&
            !(data.chequeNo?.trim())
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Cheque number is required when payment is Cheque",
                path: ["chequeNo"],
            });
        }
    });

export async function recordSupplierPayment(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = supplierPaymentSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const data = parsed.data;

    try {
        const fy = await db.financialYear.findUnique({ where: { id: data.fiscalYearId } });
        if (!fy) return { success: false, error: "Financial year not found" };

        const statement = await getSupplierStatement(data.fiscalYearId);
        const row = statement.find(
            (s) => s.supplierName.trim().toLowerCase() === data.supplierName.trim().toLowerCase()
        );
        const balanceDue = row?.balanceDue ?? 0;

        if (data.amount > balanceDue + 0.01) {
            return {
                success: false,
                error: `Amount exceeds outstanding balance (${balanceDue.toFixed(2)})`,
            };
        }

        const partner = await db.partner.findFirst({
            where: {
                name: data.supplierName.trim(),
                type: PartnerType.SUPPLIER,
            },
        });

        const paymentDateAD = new Date(data.paymentDate);
        const payment = await db.supplierPayment.create({
            data: {
                fiscalYearId: data.fiscalYearId,
                partnerId: partner?.id || null,
                supplierName: data.supplierName.trim(),
                amount: toDecimal(data.amount),
                paymentMethod: data.paymentMethod,
                chequeNo: data.chequeNo?.trim() || null,
                paymentDateAD,
                paymentDateBS: adStringToBs(data.paymentDate),
                paymentReference: data.paymentReference?.trim() || null,
                remarks: data.remarks?.trim() || null,
            },
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "SUPPLIER_PAYMENT",
            entityType: "SupplierPayment",
            entityId: payment.id,
            metadata: {
                supplierName: data.supplierName,
                amount: data.amount,
                fiscalYearId: data.fiscalYearId,
            },
        });

        revalidatePath("/dashboard/reports/statements");

        return { success: true, data: payment };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to record supplier payment");
        return { success: false, error: message };
    }
}
