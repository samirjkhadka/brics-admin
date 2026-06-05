import { PartnerEntityType, PartnerType } from "@prisma/client";
import { z } from "zod";

export const partnerSchema = z
    .object({
        name: z.string().min(1, "Partner name is required"),
        type: z.nativeEnum(PartnerType),
        entityType: z.nativeEnum(PartnerEntityType).default(PartnerEntityType.BUSINESS),
        contactPerson: z.string().optional().nullable(),
        contactNo: z.string().optional().nullable(),
        email: z
            .string()
            .optional()
            .nullable()
            .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
                message: "Valid email required",
            }),
        vatNo: z.string().optional().nullable(),
        bankName: z.string().optional().nullable(),
        accountNumber: z.string().optional().nullable(),
        accountHolderName: z.string().optional().nullable(),
        branch: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        remarks: z.string().optional().nullable(),
        isActive: z.boolean().default(true),
    })
    .transform((data) => ({
        ...data,
        bankName: data.bankName?.trim() || "Pending",
        accountNumber: data.accountNumber?.trim() || "Pending",
    }))
    .refine(
        (data) => {
            if (data.type === PartnerType.CUSTOMER) return true;
            return (
                data.bankName !== "Pending" &&
                data.accountNumber !== "Pending" &&
                data.bankName.length > 0 &&
                data.accountNumber.length > 0
            );
        },
        { message: "Suppliers require bank name and account number", path: ["bankName"] }
    );

export type PartnerInput = z.infer<typeof partnerSchema>;
