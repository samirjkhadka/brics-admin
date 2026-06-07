"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { FiscalYearStatus, PartnerType, Role } from "@prisma/client";
import { calculateTax } from "@/lib/utils/calculations";
import { toDecimal } from "@/lib/utils/decimal";
import { requireRole } from "@/lib/auth/session";
import { publicErrorMessage } from "@/lib/security/sanitize-error";
import {
    transactionSchema,
    voidTransactionSchema,
    bulkVoidTransactionsSchema,
    bulkDeleteTransactionsSchema,
    TransactionInput,
} from "@/lib/validations/transaction";
import { upsertPartnerFromTicketEntry } from "@/lib/partners/upsert-from-ticket";
import {
    allocateNextSalesBillNo,
    resolveFinancialYearForDate,
} from "@/lib/fiscal-year/service";
import {
    derivePaymentStatus,
    resolveReceivedStatusForSave,
} from "@/lib/utils/payment-status";
import { writeAuditLog } from "@/lib/audit/log";
import { expandTransactionIdsWithBookingGroups } from "@/lib/booking/group";

function resolveAmountReceived(input: TransactionInput): number {
    if (input.amountReceived != null && input.amountReceived > 0) {
        return input.amountReceived;
    }
    if (input.receivedDate) return input.salesAmount;
    return 0;
}

function buildTransactionData(
    input: TransactionInput,
    extras: {
        fiscalYearId?: string | null;
        billSequence?: number | null;
        salesBillNo: string;
    }
) {
    const { taxableAmount, vatAmount } = calculateTax(input.salesAmount, input.exemptAmount);
    const amountReceived = resolveAmountReceived(input);

    const passengerData =
        typeof input.passengerNames === "string"
            ? input.passengerNames
            : JSON.stringify(input.passengerNames);

    return {
        passengerNames: passengerData,
        partyName: input.partyName,
        purchasePartyName: input.purchasePartyName,
        sector: input.sector,
        salesBillNo: extras.salesBillNo,
        billSequence: extras.billSequence ?? null,
        fiscalYearId: extras.fiscalYearId ?? null,
        salesDate: new Date(input.salesDate),
        salesDateBS: input.salesDateBS,
        purchaseInvoiceNo: input.purchaseInvoiceNo,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchaseDateBS: input.purchaseDateBS || null,
        purchaseAmount: toDecimal(input.purchaseAmount),
        salesAmount: toDecimal(input.salesAmount),
        exemptAmount: toDecimal(input.exemptAmount),
        taxableAmount: toDecimal(taxableAmount),
        vatAmount: toDecimal(vatAmount),
        receivedStatus: resolveReceivedStatusForSave(
            input.receivedStatus,
            amountReceived,
            input.receivedDate
        ),
        amountReceived: toDecimal(amountReceived),
        paymentStatus: derivePaymentStatus(input.salesAmount, amountReceived),
        receivedDate: input.receivedDate ? new Date(input.receivedDate) : null,
        receiptNo: input.receiptNo || null,
        chequeNo: input.chequeNo || null,
        remarks: input.remarks || null,
        travelDate: input.travelDate ? new Date(input.travelDate) : null,
        partyVatNo: input.partyVatNo || null,
        contactNo: input.contactNo || null,
        hsCode: input.hsCode || null,
    };
}

async function persistPartnersFromTransaction(input: TransactionInput) {
    await Promise.all([
        upsertPartnerFromTicketEntry({
            name: input.partyName,
            type: PartnerType.CUSTOMER,
            vatNo: input.partyVatNo,
            contactNo: input.contactNo,
        }),
        upsertPartnerFromTicketEntry({
            name: input.purchasePartyName,
            type: PartnerType.SUPPLIER,
        }),
    ]);
}

async function validateFiscalYearForCreate(salesDate: string) {
    const fy = await resolveFinancialYearForDate(new Date(salesDate));
    if (fy.status !== FiscalYearStatus.OPEN) {
        return { ok: false as const, error: "Cannot create bills in a closed financial year" };
    }
    return { ok: true as const, fy };
}

export async function checkDuplicateBillNo(salesBillNo: string, excludeId?: string) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const existing = await db.transaction.findFirst({
        where: {
            salesBillNo,
            ...(excludeId ? { NOT: { id: excludeId } } : {}),
        },
    });
    return { success: true, duplicate: !!existing };
}

export async function createTransaction(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = transactionSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const fyCheck = await validateFiscalYearForCreate(parsed.data.salesDate);
        if (!fyCheck.ok) return { success: false, error: fyCheck.error };

        const bill = await allocateNextSalesBillNo(fyCheck.fy.id);
        await persistPartnersFromTransaction(parsed.data);

        const transaction = await db.transaction.create({
            data: {
                ...buildTransactionData(parsed.data, {
                    fiscalYearId: bill.fiscalYearId,
                    billSequence: bill.billSequence,
                    salesBillNo: bill.salesBillNo,
                }),
                purchaseLegs: {
                    create: [
                        {
                            legIndex: 1,
                            purchaseInvoiceNo: parsed.data.purchaseInvoiceNo,
                            purchasePartyName: parsed.data.purchasePartyName,
                            sector: parsed.data.sector,
                            purchaseDate: parsed.data.purchaseDate
                                ? new Date(parsed.data.purchaseDate)
                                : null,
                            purchaseDateBS: parsed.data.purchaseDateBS || null,
                            travelDate: parsed.data.travelDate
                                ? new Date(parsed.data.travelDate)
                                : null,
                            travelDateBS: null,
                            purchaseAmount: toDecimal(parsed.data.purchaseAmount),
                            lineSalesAmount: toDecimal(parsed.data.salesAmount),
                        },
                    ],
                },
            },
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "CREATE_TX",
            entityType: "Transaction",
            entityId: transaction.id,
            metadata: { salesBillNo: transaction.salesBillNo },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath("/dashboard/partners");

        return { success: true, data: transaction };
    } catch (error: unknown) {
        console.error("TX Error:", error);
        const message = publicErrorMessage(error, "Failed to create transaction");
        return { success: false, error: message };
    }
}

export async function updateTransaction(id: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const existing = await db.transaction.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "Transaction not found" };
        if (existing.isVoided) return { success: false, error: "Cannot edit voided transaction" };

        const parsed = transactionSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        if (existing.fiscalYearId) {
            const fy = await db.financialYear.findUnique({
                where: { id: existing.fiscalYearId },
            });
            if (fy?.status === FiscalYearStatus.CLOSED) {
                return { success: false, error: "Cannot edit transactions in a closed financial year" };
            }
        }

        await persistPartnersFromTransaction(parsed.data);

        const transaction = await db.transaction.update({
            where: { id },
            data: buildTransactionData(parsed.data, {
                fiscalYearId: existing.fiscalYearId,
                billSequence: existing.billSequence,
                salesBillNo: existing.salesBillNo,
            }),
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "UPDATE_TX",
            entityType: "Transaction",
            entityId: transaction.id,
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath(`/dashboard/tickets/${id}`);
        revalidatePath("/dashboard/partners");

        return { success: true, data: transaction };
    } catch (error: unknown) {
        console.error("Update TX Error:", error);
        const message = publicErrorMessage(error, "Failed to update transaction");
        return { success: false, error: message };
    }
}

export async function voidTransaction(id: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = voidTransactionSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const existing = await db.transaction.findUnique({ where: { id } });
        if (!existing) return { success: false, error: "Transaction not found" };
        if (existing.isVoided) return { success: false, error: "Transaction is already voided" };

        await db.transaction.update({
            where: { id },
            data: {
                isVoided: true,
                voidReason: parsed.data.reason.trim(),
                voidedAt: new Date(),
            },
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "VOID_TX",
            entityType: "Transaction",
            entityId: id,
            metadata: { reason: parsed.data.reason },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath(`/dashboard/tickets/${id}`);

        return { success: true };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to void transaction");
        return { success: false, error: message };
    }
}

export async function deleteTransaction(id: string) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        await db.transaction.delete({ where: { id } });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "DELETE_TX",
            entityType: "Transaction",
            entityId: id,
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");

        return { success: true };
    } catch (error: unknown) {
        console.error("Delete TX Error:", error);
        const message = publicErrorMessage(error, "Failed to delete transaction");
        return { success: false, error: message };
    }
}

export async function bulkVoidTransactions(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = bulkVoidTransactionsSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const { transactionIds, reason, expandBookingGroups } = parsed.data;

    try {
        const targetIds = expandBookingGroups
            ? await expandTransactionIdsWithBookingGroups(transactionIds)
            : transactionIds;

        const transactions = await db.transaction.findMany({
            where: { id: { in: targetIds } },
            select: { id: true, salesBillNo: true, isVoided: true },
        });

        if (transactions.length !== targetIds.length) {
            return { success: false, error: "One or more transactions not found" };
        }

        const voidable = transactions.filter((t) => !t.isVoided);
        if (voidable.length === 0) {
            return { success: false, error: "All selected transactions are already voided" };
        }

        const voidedAt = new Date();
        const trimmedReason = reason.trim();

        await db.transaction.updateMany({
            where: { id: { in: voidable.map((t) => t.id) }, isVoided: false },
            data: {
                isVoided: true,
                voidReason: trimmedReason,
                voidedAt,
            },
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "BULK_VOID_TX",
            entityType: "Transaction",
            entityId: voidable[0].id,
            metadata: {
                reason: trimmedReason,
                count: voidable.length,
                billNos: voidable.map((t) => t.salesBillNo),
                transactionIds: voidable.map((t) => t.id),
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");

        return {
            success: true,
            count: voidable.length,
            skipped: transactions.length - voidable.length,
        };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to void transactions");
        return { success: false, error: message };
    }
}

export async function bulkDeleteTransactions(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = bulkDeleteTransactionsSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const { transactionIds, expandBookingGroups } = parsed.data;

    try {
        const targetIds = expandBookingGroups
            ? await expandTransactionIdsWithBookingGroups(transactionIds)
            : transactionIds;

        const transactions = await db.transaction.findMany({
            where: { id: { in: targetIds } },
            select: { id: true, salesBillNo: true },
        });

        if (transactions.length !== targetIds.length) {
            return { success: false, error: "One or more transactions not found" };
        }

        await db.transaction.deleteMany({ where: { id: { in: targetIds } } });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "BULK_DELETE_TX",
            entityType: "Transaction",
            entityId: transactions[0].id,
            metadata: {
                count: transactions.length,
                billNos: transactions.map((t) => t.salesBillNo),
                transactionIds: transactions.map((t) => t.id),
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");

        return { success: true, count: transactions.length };
    } catch (error: unknown) {
        console.error("Bulk Delete TX Error:", error);
        const message = publicErrorMessage(error, "Failed to delete transactions");
        return { success: false, error: message };
    }
}

export async function bulkCreateTransactions(
    rows: unknown[],
    options?: { revalidate?: boolean; startRowIndex?: number; spreadsheetRow?: number }
) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const startRowIndex = options?.startRowIndex ?? 0;
    const created: string[] = [];
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
        const spreadsheetRow =
            rows.length === 1 && options?.spreadsheetRow != null
                ? options.spreadsheetRow
                : startRowIndex + i + 2;
        const parsed = transactionSchema.safeParse(rows[i]);
        if (!parsed.success) {
            errors.push({
                row: spreadsheetRow,
                message: parsed.error.issues[0]?.message || "Invalid row",
            });
            continue;
        }

        try {
            const fyCheck = await validateFiscalYearForCreate(parsed.data.salesDate);
            if (!fyCheck.ok) {
                errors.push({ row: spreadsheetRow, message: fyCheck.error });
                continue;
            }

            const bill = await allocateNextSalesBillNo(fyCheck.fy.id);
            await persistPartnersFromTransaction(parsed.data);

            const tx = await db.transaction.create({
                data: {
                    ...buildTransactionData(parsed.data, {
                        fiscalYearId: bill.fiscalYearId,
                        billSequence: bill.billSequence,
                        salesBillNo: bill.salesBillNo,
                    }),
                    purchaseLegs: {
                        create: [
                            {
                                legIndex: 1,
                                purchaseInvoiceNo: parsed.data.purchaseInvoiceNo,
                                purchasePartyName: parsed.data.purchasePartyName,
                                sector: parsed.data.sector,
                                purchaseDate: parsed.data.purchaseDate
                                    ? new Date(parsed.data.purchaseDate)
                                    : null,
                                purchaseDateBS: parsed.data.purchaseDateBS || null,
                                travelDate: parsed.data.travelDate
                                    ? new Date(parsed.data.travelDate)
                                    : null,
                                travelDateBS: null,
                                purchaseAmount: toDecimal(parsed.data.purchaseAmount),
                                lineSalesAmount: toDecimal(parsed.data.salesAmount),
                            },
                        ],
                    },
                },
            });
            created.push(tx.salesBillNo);
        } catch (error: unknown) {
            const message = publicErrorMessage(error, "Failed to create");
            errors.push({ row: spreadsheetRow, message });
        }
    }

    if (options?.revalidate !== false) {
        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath("/dashboard/partners");
    }

    return {
        success: true,
        created: created.length,
        failed: errors.length,
        errors,
        createdBills: created,
    };
}
