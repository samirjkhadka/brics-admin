import { PaymentMethod } from "@prisma/client";
import { z } from "zod";

export const purchaseLegSchema = z.object({
    purchaseInvoiceNo: z.string().min(1, "Purchase invoice number is required"),
    purchasePartyName: z.string().min(1, "Supplier is required"),
    sector: z.string().min(1, "Sector is required"),
    purchaseDate: z.string().optional().nullable(),
    purchaseDateBS: z.string().optional().nullable(),
    travelDate: z.string().optional().nullable(),
    travelDateBS: z.string().optional().nullable(),
    purchaseAmount: z.coerce.number().min(0, "Purchase amount cannot be negative"),
    lineSalesAmount: z.coerce.number().min(0).optional(),
    salesAmount: z.coerce.number().min(0).optional(),
    exemptAmount: z.coerce.number().min(0).optional(),
    ticketNo: z.string().optional().nullable(),
});

const sharedBookingFields = z.object({
    passengerNames: z.string().min(1, "Passenger names are required"),
    partyName: z.string().min(1, "Party name is required"),
    salesDate: z.string().min(1, "Sales date is required"),
    salesDateBS: z.string().min(1, "Sales date (BS) is required"),
    partyVatNo: z.string().optional().nullable(),
    contactNo: z.string().optional().nullable(),
    hsCode: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    receivedStatus: z.nativeEnum(PaymentMethod).optional(),
    receivedDate: z.string().optional().nullable(),
    receiptNo: z.string().optional().nullable(),
    chequeNo: z.string().optional().nullable(),
    amountReceived: z.coerce.number().min(0).optional().nullable(),
    purchaseLegs: z.array(purchaseLegSchema).default([]),
});

export const createBookingSchema = z
    .discriminatedUnion("billingMode", [
        sharedBookingFields.extend({
            billingMode: z.literal("SINGLE"),
            salesAmount: z.coerce.number().min(0, "Sales amount is required"),
            exemptAmount: z.coerce.number().default(0),
            sector: z.string().optional(),
            travelDate: z.string().optional().nullable(),
            travelDateBS: z.string().optional().nullable(),
        }),
        sharedBookingFields.extend({
            billingMode: z.literal("SPLIT"),
        }),
    ])
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

        if (data.billingMode === "SINGLE") {
            if (data.salesAmount < data.exemptAmount) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Exempt amount cannot exceed sales amount",
                    path: ["exemptAmount"],
                });
            }
            if (data.purchaseLegs.length === 0) {
                if (!data.sector?.trim()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Sector is required when there are no purchase legs",
                        path: ["sector"],
                    });
                }
                if (data.salesAmount <= 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Sales amount is required for sales-only entries",
                        path: ["salesAmount"],
                    });
                }
            }
        } else {
            if (data.purchaseLegs.length === 0) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Split billing requires at least one purchase leg",
                    path: ["purchaseLegs"],
                });
            }
            for (let i = 0; i < data.purchaseLegs.length; i++) {
                const leg = data.purchaseLegs[i];
                if ((leg.salesAmount ?? 0) <= 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "Sales amount is required for each leg",
                        path: ["purchaseLegs", i, "salesAmount"],
                    });
                }
            }
        }
    });

export const updateBookingSchema = createBookingSchema;

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type PurchaseLegInput = z.infer<typeof purchaseLegSchema>;
