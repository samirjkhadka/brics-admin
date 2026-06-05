import { z } from "zod";
import { PaymentMethod, RefundType } from "@prisma/client";

export const createRefundSchema = z
    .object({
        refundType: z.nativeEnum(RefundType),
        customerRefundAmount: z.coerce.number().positive("Customer refund amount must be greater than zero"),
        customerCashAmount: z.coerce.number().min(0).optional(),
        supplierCreditAmount: z.coerce.number().min(0).optional(),
        supplierCreditNoteNo: z.string().optional().nullable(),
        refundDate: z.string().min(1, "Refund date is required"),
        paymentMethod: z.nativeEnum(PaymentMethod).optional().nullable(),
        paymentReference: z.string().optional().nullable(),
        remarks: z.string().optional().nullable(),
    })
    .superRefine((data, ctx) => {
        if (data.refundType === RefundType.CUSTOMER_AND_SUPPLIER) {
            if (!data.supplierCreditNoteNo?.trim()) {
                ctx.addIssue({
                    code: "custom",
                    message: "Supplier credit note number is required",
                    path: ["supplierCreditNoteNo"],
                });
            }
            if (!data.supplierCreditAmount || data.supplierCreditAmount <= 0) {
                ctx.addIssue({
                    code: "custom",
                    message: "Supplier credit amount is required",
                    path: ["supplierCreditAmount"],
                });
            }
        }
        if ((data.customerCashAmount ?? 0) > 0 && !data.paymentMethod) {
            ctx.addIssue({
                code: "custom",
                message: "Payment method is required when cash is refunded to customer",
                path: ["paymentMethod"],
            });
        }
    });
