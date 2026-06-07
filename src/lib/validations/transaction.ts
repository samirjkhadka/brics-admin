import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const transactionSchema = z
    .object({
        passengerNames: z.string().min(1, "Passenger names are required"),
        partyName: z.string().min(1, "Party name is required"),
        purchasePartyName: z.string().min(1, "Purchased from is required"),
        sector: z.string().min(1, "Sector is required"),
        salesBillNo: z.string().min(1, "Sales bill number is required"),
        salesDate: z.string().min(1, "Sales date is required"),
        salesDateBS: z.string().min(1, "Sales date (BS) is required"),
        purchaseInvoiceNo: z.string().min(1, "Purchase invoice number is required"),
        purchaseDate: z.string().optional().nullable(),
        purchaseDateBS: z.string().optional().nullable(),
        purchaseAmount: z.coerce.number().min(0, "Purchase amount cannot be negative"),
        salesAmount: z.coerce.number().min(0, "Sales amount cannot be negative"),
        exemptAmount: z.coerce.number().default(0),
        receivedStatus: z.nativeEnum(PaymentMethod).optional(),
        receivedDate: z.string().optional().nullable(),
        receiptNo: z.string().optional().nullable(),
        chequeNo: z.string().optional().nullable(),
        remarks: z.string().optional().nullable(),
        travelDate: z.string().optional().nullable(),
        partyVatNo: z.string().optional().nullable(),
        contactNo: z.string().optional().nullable(),
        hsCode: z.string().optional().nullable(),
        amountReceived: z.coerce.number().min(0).optional().nullable(),
    })
    .refine((data) => data.salesAmount >= data.exemptAmount, {
        message: "Exempt amount cannot be greater than sales amount",
        path: ["exemptAmount"],
    })
    .superRefine((data, ctx) => {
        const hasPayment =
            (data.amountReceived ?? 0) > 0 || !!(data.receivedDate && data.receivedDate.trim());

        if (hasPayment && !data.receivedStatus) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Payment method is required when recording payment",
                path: ["receivedStatus"],
            });
        }

        if (
            hasPayment &&
            data.receivedStatus === PaymentMethod.CHEQUE &&
            !(data.chequeNo?.trim())
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Cheque number is required when payment is Cheque",
                path: ["chequeNo"],
            });
        }
    })
    .refine(
        (data) => {
            if (!data.purchaseDate || !data.salesDate) return true;
            const purchase = new Date(data.purchaseDate);
            const sales = new Date(data.salesDate);
            purchase.setHours(0, 0, 0, 0);
            sales.setHours(0, 0, 0, 0);
            return sales >= purchase;
        },
        {
            message: "Sales date cannot be before purchase date",
            path: ["salesDate"],
        }
    );

export const voidTransactionSchema = z.object({
    reason: z.string().min(1, "Void reason is required"),
});

export const bulkVoidTransactionsSchema = z.object({
    transactionIds: z.array(z.string().min(1)).min(1, "Select at least one transaction"),
    reason: z.string().min(1, "Void reason is required"),
    expandBookingGroups: z.boolean().optional().default(false),
});

export const bulkDeleteTransactionsSchema = z.object({
    transactionIds: z.array(z.string().min(1)).min(1, "Select at least one transaction"),
    expandBookingGroups: z.boolean().optional().default(false),
});

export type TransactionInput = z.infer<typeof transactionSchema>;
