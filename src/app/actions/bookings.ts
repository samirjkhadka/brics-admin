"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { BillingMode, FiscalYearStatus, PartnerType, Role } from "@prisma/client";
import { randomUUID } from "crypto";
import { calculateTax } from "@/lib/utils/calculations";
import { toDecimal } from "@/lib/utils/decimal";
import { requireRole } from "@/lib/auth/session";
import { createBookingSchema, updateBookingSchema } from "@/lib/validations/booking";
import { upsertPartnerFromTicketEntry } from "@/lib/partners/upsert-from-ticket";
import {
    allocateBillSequences,
    allocateNextSalesBillNo,
    peekSalesBillNos,
    resolveFinancialYearForDate,
} from "@/lib/fiscal-year/service";
import {
    derivePaymentStatus,
    resolveReceivedStatusForSave,
} from "@/lib/utils/payment-status";
import { OWN_SALES_LABEL } from "@/lib/utils/purchase-party";
import { writeAuditLog } from "@/lib/audit/log";
import {
    allocateLineSalesAmounts,
    earliestPurchaseDate,
    earliestTravelDate,
    joinSectors,
    legTravelFields,
    summarizePurchaseInvoices,
    type SalesOnlyTrip,
} from "@/lib/booking/helpers";
import type { PurchaseLegInput } from "@/lib/validations/booking";
import { publicErrorMessage } from "@/lib/security/sanitize-error";

async function validateFiscalYearForCreate(salesDate: string) {
    const fy = await resolveFinancialYearForDate(new Date(salesDate));
    if (fy.status !== FiscalYearStatus.OPEN) {
        return { ok: false as const, error: "Cannot create bills in a closed financial year" };
    }
    return { ok: true as const, fy };
}

async function persistPartnersFromLegs(
    partyName: string,
    partyVatNo: string | null | undefined,
    contactNo: string | null | undefined,
    legs: PurchaseLegInput[]
) {
    await upsertPartnerFromTicketEntry({
        name: partyName,
        type: PartnerType.CUSTOMER,
        vatNo: partyVatNo,
        contactNo,
    });
    const suppliers = [...new Set(legs.map((l) => l.purchasePartyName).filter(Boolean))];
    await Promise.all(
        suppliers.map((name) =>
            upsertPartnerFromTicketEntry({ name, type: PartnerType.SUPPLIER })
        )
    );
    revalidatePath("/dashboard/partners");
}

function resolveAmountReceived(
    salesAmount: number,
    receivedDate: string | null | undefined,
    amountReceived: number | null | undefined
): number {
    if (amountReceived != null && amountReceived > 0) return amountReceived;
    if (receivedDate) return salesAmount;
    return 0;
}

function buildLegRows(legs: PurchaseLegInput[], lineSalesAmounts: number[]) {
    return legs.map((leg, index) => ({
        legIndex: index + 1,
        purchaseInvoiceNo: leg.purchaseInvoiceNo.trim(),
        purchasePartyName: leg.purchasePartyName.trim(),
        sector: leg.sector.trim().toUpperCase(),
        purchaseDate: leg.purchaseDate ? new Date(leg.purchaseDate) : null,
        purchaseDateBS: leg.purchaseDateBS || null,
        ...legTravelFields(leg),
        purchaseAmount: toDecimal(leg.purchaseAmount),
        lineSalesAmount: toDecimal(lineSalesAmounts[index]),
        exemptAmount: toDecimal(leg.exemptAmount ?? 0),
        ticketNo: leg.ticketNo?.trim() || null,
    }));
}

function denormalizeFromLegs(
    legs: PurchaseLegInput[],
    lineSalesAmounts: number[],
    salesAmount: number,
    exemptAmount: number,
    salesOnlyTrip?: SalesOnlyTrip
) {
    const { taxableAmount, vatAmount } = calculateTax(salesAmount, exemptAmount);

    if (legs.length === 0) {
        const travel = salesOnlyTrip?.travelDate
            ? legTravelFields({
                  travelDate: salesOnlyTrip.travelDate,
                  travelDateBS: salesOnlyTrip.travelDateBS,
              })
            : { travelDate: null, travelDateBS: null };

        return {
            sector: (salesOnlyTrip?.sector || "").trim().toUpperCase(),
            purchaseInvoiceNo: "",
            purchasePartyName: OWN_SALES_LABEL,
            purchaseDate: null,
            purchaseDateBS: null,
            travelDate: travel.travelDate,
            purchaseAmount: toDecimal(0),
            salesAmount: toDecimal(salesAmount),
            exemptAmount: toDecimal(exemptAmount),
            taxableAmount: toDecimal(taxableAmount),
            vatAmount: toDecimal(vatAmount),
            lineSalesAmounts: [] as number[],
        };
    }

    const purchaseAmount = legs.reduce((s, l) => s + l.purchaseAmount, 0);
    const firstLeg = legs[0];
    const purchaseDate = earliestPurchaseDate(legs);
    const travelDate = earliestTravelDate(legs);

    return {
        sector: joinSectors(legs),
        purchaseInvoiceNo: summarizePurchaseInvoices(legs),
        purchasePartyName: firstLeg.purchasePartyName.trim(),
        purchaseDate,
        purchaseDateBS: firstLeg.purchaseDateBS || null,
        travelDate,
        purchaseAmount: toDecimal(purchaseAmount),
        salesAmount: toDecimal(salesAmount),
        exemptAmount: toDecimal(exemptAmount),
        taxableAmount: toDecimal(taxableAmount),
        vatAmount: toDecimal(vatAmount),
        lineSalesAmounts,
    };
}

function salesOnlyTripFromSingle(data: {
    purchaseLegs: PurchaseLegInput[];
    sector?: string;
    travelDate?: string | null;
    travelDateBS?: string | null;
}): SalesOnlyTrip | undefined {
    if (data.purchaseLegs.length > 0) return undefined;
    return {
        sector: data.sector || "",
        travelDate: data.travelDate,
        travelDateBS: data.travelDateBS,
    };
}

export async function createBooking(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = createBookingSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const data = parsed.data;
    const fyCheck = await validateFiscalYearForCreate(data.salesDate);
    if (!fyCheck.ok) return { success: false, error: fyCheck.error };

    await persistPartnersFromLegs(
        data.partyName,
        data.partyVatNo,
        data.contactNo,
        data.purchaseLegs
    );

    try {
        if (data.billingMode === BillingMode.SINGLE) {
            const lineSalesAmounts = allocateLineSalesAmounts(
                data.purchaseLegs,
                data.salesAmount
            );
            const denorm = denormalizeFromLegs(
                data.purchaseLegs,
                lineSalesAmounts,
                data.salesAmount,
                data.exemptAmount,
                salesOnlyTripFromSingle(data)
            );
            const bill = await allocateNextSalesBillNo(fyCheck.fy.id);
            const amountReceived = resolveAmountReceived(
                data.salesAmount,
                data.receivedDate,
                data.amountReceived
            );

            const transaction = await db.transaction.create({
                data: {
                    passengerNames: data.passengerNames,
                    partyName: data.partyName,
                    purchasePartyName: denorm.purchasePartyName,
                    sector: denorm.sector,
                    salesBillNo: bill.salesBillNo,
                    billSequence: bill.billSequence,
                    fiscalYearId: bill.fiscalYearId,
                    salesDate: new Date(data.salesDate),
                    salesDateBS: data.salesDateBS,
                    purchaseInvoiceNo: denorm.purchaseInvoiceNo,
                    purchaseDate: denorm.purchaseDate,
                    purchaseDateBS: denorm.purchaseDateBS,
                    purchaseAmount: denorm.purchaseAmount,
                    salesAmount: denorm.salesAmount,
                    exemptAmount: denorm.exemptAmount,
                    taxableAmount: denorm.taxableAmount,
                    vatAmount: denorm.vatAmount,
                    receivedStatus: resolveReceivedStatusForSave(
                        data.receivedStatus,
                        amountReceived,
                        data.receivedDate
                    ),
                    amountReceived: toDecimal(amountReceived),
                    paymentStatus: derivePaymentStatus(data.salesAmount, amountReceived),
                    receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
                    receiptNo: data.receiptNo || null,
                    chequeNo: data.chequeNo || null,
                    remarks: data.remarks || null,
                    travelDate: denorm.travelDate,
                    partyVatNo: data.partyVatNo || null,
                    contactNo: data.contactNo || null,
                    hsCode: data.hsCode || null,
                    billingMode: BillingMode.SINGLE,
                    bookingGroupId: null,
                    purchaseLegs: {
                        create: buildLegRows(data.purchaseLegs, lineSalesAmounts),
                    },
                },
                include: { purchaseLegs: true },
            });

            await writeAuditLog({
                userId: auth.session.user.id,
                userName: auth.session.user.name,
                action: "CREATE_BOOKING_SINGLE",
                entityType: "Transaction",
                entityId: transaction.id,
                metadata: {
                    salesBillNo: transaction.salesBillNo,
                    legCount: data.purchaseLegs.length,
                },
            });

            revalidatePath("/dashboard");
            revalidatePath("/dashboard/tickets");
            revalidatePath("/dashboard/partners");

            return { success: true, data: transaction, createdIds: [transaction.id] };
        }

        if (data.purchaseLegs.length === 0) {
            return {
                success: false,
                error: "Split billing requires at least one purchase leg",
            };
        }

        const bookingGroupId = randomUUID();
        const createdIds: string[] = [];
        const createdBills: string[] = [];
        const allocatedBills = await allocateBillSequences(
            fyCheck.fy.id,
            data.purchaseLegs.length
        );

        for (let i = 0; i < data.purchaseLegs.length; i++) {
            const leg = data.purchaseLegs[i];
            const salesAmount = leg.salesAmount ?? 0;
            const exemptAmount = leg.exemptAmount ?? 0;
            const { taxableAmount, vatAmount } = calculateTax(salesAmount, exemptAmount);
            const bill = allocatedBills[i];
            const amountReceived = resolveAmountReceived(
                salesAmount,
                data.receivedDate,
                data.amountReceived
            );

            const transaction = await db.transaction.create({
                data: {
                    passengerNames: data.passengerNames,
                    partyName: data.partyName,
                    purchasePartyName: leg.purchasePartyName.trim(),
                    sector: leg.sector.trim().toUpperCase(),
                    salesBillNo: bill.salesBillNo,
                    billSequence: bill.billSequence,
                    fiscalYearId: bill.fiscalYearId,
                    salesDate: new Date(data.salesDate),
                    salesDateBS: data.salesDateBS,
                    purchaseInvoiceNo: leg.purchaseInvoiceNo.trim(),
                    purchaseDate: leg.purchaseDate ? new Date(leg.purchaseDate) : null,
                    purchaseDateBS: leg.purchaseDateBS || null,
                    purchaseAmount: toDecimal(leg.purchaseAmount),
                    salesAmount: toDecimal(salesAmount),
                    exemptAmount: toDecimal(exemptAmount),
                    taxableAmount: toDecimal(taxableAmount),
                    vatAmount: toDecimal(vatAmount),
                    receivedStatus: resolveReceivedStatusForSave(
                        data.receivedStatus,
                        amountReceived,
                        data.receivedDate
                    ),
                    amountReceived: toDecimal(amountReceived),
                    paymentStatus: derivePaymentStatus(salesAmount, amountReceived),
                    receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
                    receiptNo: data.receiptNo || null,
                    chequeNo: data.chequeNo || null,
                    remarks: data.remarks || null,
                    travelDate: legTravelFields(leg).travelDate,
                    partyVatNo: data.partyVatNo || null,
                    contactNo: data.contactNo || null,
                    hsCode: data.hsCode || null,
                    billingMode: BillingMode.SPLIT,
                    bookingGroupId,
                    purchaseLegs: {
                        create: [
                            {
                                legIndex: 1,
                                purchaseInvoiceNo: leg.purchaseInvoiceNo.trim(),
                                purchasePartyName: leg.purchasePartyName.trim(),
                                sector: leg.sector.trim().toUpperCase(),
                                purchaseDate: leg.purchaseDate ? new Date(leg.purchaseDate) : null,
                                purchaseDateBS: leg.purchaseDateBS || null,
                                ...legTravelFields(leg),
                                purchaseAmount: toDecimal(leg.purchaseAmount),
                                lineSalesAmount: toDecimal(salesAmount),
                                exemptAmount: toDecimal(exemptAmount),
                                ticketNo: leg.ticketNo?.trim() || null,
                            },
                        ],
                    },
                },
            });

            createdIds.push(transaction.id);
            createdBills.push(transaction.salesBillNo);
        }

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "CREATE_BOOKING_SPLIT",
            entityType: "Transaction",
            entityId: createdIds[0],
            metadata: { bookingGroupId, billNos: createdBills, legCount: data.purchaseLegs.length },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath("/dashboard/partners");

        return {
            success: true,
            data: { bookingGroupId, createdIds, salesBillNos: createdBills },
            createdIds,
        };
    } catch (error: unknown) {
        console.error("Create booking error:", error);
        const message = publicErrorMessage(error, "Failed to create booking");
        return { success: false, error: message };
    }
}

export async function updateBooking(id: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const existing = await db.transaction.findUnique({
        where: { id },
        include: { purchaseLegs: { orderBy: { legIndex: "asc" } } },
    });
    if (!existing) return { success: false, error: "Transaction not found" };
    if (existing.isVoided) return { success: false, error: "Cannot edit voided transaction" };

    const parsed = updateBookingSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const data = parsed.data;

    if (existing.fiscalYearId) {
        const fy = await db.financialYear.findUnique({ where: { id: existing.fiscalYearId } });
        if (fy?.status === FiscalYearStatus.CLOSED) {
            return { success: false, error: "Cannot edit transactions in a closed financial year" };
        }
    }

    await persistPartnersFromLegs(
        data.partyName,
        data.partyVatNo,
        data.contactNo,
        data.purchaseLegs
    );

    try {
        if (existing.billingMode === BillingMode.SPLIT) {
            const leg = data.purchaseLegs[0];
            if (!leg) return { success: false, error: "Purchase leg is required" };

            const salesAmount =
                data.billingMode === "SPLIT"
                    ? (leg.salesAmount ?? Number(existing.salesAmount))
                    : Number(existing.salesAmount);
            const exemptAmount =
                data.billingMode === "SPLIT"
                    ? (leg.exemptAmount ?? Number(existing.exemptAmount))
                    : Number(existing.exemptAmount);
            const { taxableAmount, vatAmount } = calculateTax(salesAmount, exemptAmount);
            const amountReceived = resolveAmountReceived(
                salesAmount,
                data.receivedDate,
                data.amountReceived ?? Number(existing.amountReceived)
            );

            await db.purchaseLeg.deleteMany({ where: { transactionId: id } });

            const transaction = await db.transaction.update({
                where: { id },
                data: {
                    passengerNames: data.passengerNames,
                    partyName: data.partyName,
                    purchasePartyName: leg.purchasePartyName.trim(),
                    sector: leg.sector.trim().toUpperCase(),
                    salesDate: new Date(data.salesDate),
                    salesDateBS: data.salesDateBS,
                    purchaseInvoiceNo: leg.purchaseInvoiceNo.trim(),
                    purchaseDate: leg.purchaseDate ? new Date(leg.purchaseDate) : null,
                    purchaseDateBS: leg.purchaseDateBS || null,
                    purchaseAmount: toDecimal(leg.purchaseAmount),
                    salesAmount: toDecimal(salesAmount),
                    exemptAmount: toDecimal(exemptAmount),
                    taxableAmount: toDecimal(taxableAmount),
                    vatAmount: toDecimal(vatAmount),
                    receivedStatus: resolveReceivedStatusForSave(
                        data.receivedStatus,
                        amountReceived,
                        data.receivedDate
                    ),
                    amountReceived: toDecimal(amountReceived),
                    paymentStatus: derivePaymentStatus(salesAmount, amountReceived),
                    receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
                    receiptNo: data.receiptNo || null,
                    chequeNo: data.chequeNo || null,
                    remarks: data.remarks || null,
                    travelDate: legTravelFields(leg).travelDate,
                    partyVatNo: data.partyVatNo || null,
                    contactNo: data.contactNo || null,
                    hsCode: data.hsCode || null,
                    purchaseLegs: {
                        create: [
                            {
                                legIndex: 1,
                                purchaseInvoiceNo: leg.purchaseInvoiceNo.trim(),
                                purchasePartyName: leg.purchasePartyName.trim(),
                                sector: leg.sector.trim().toUpperCase(),
                                purchaseDate: leg.purchaseDate ? new Date(leg.purchaseDate) : null,
                                purchaseDateBS: leg.purchaseDateBS || null,
                                ...legTravelFields(leg),
                                purchaseAmount: toDecimal(leg.purchaseAmount),
                                lineSalesAmount: toDecimal(salesAmount),
                                exemptAmount: toDecimal(exemptAmount),
                                ticketNo: leg.ticketNo?.trim() || null,
                            },
                        ],
                    },
                },
            });

            revalidatePaths(id);
            return { success: true, data: transaction };
        }

        if (data.billingMode !== "SINGLE") {
            return {
                success: false,
                error: "Cannot change a single-bill booking to split mode on edit",
            };
        }

        const lineSalesAmounts = allocateLineSalesAmounts(
            data.purchaseLegs,
            data.salesAmount
        );
        const denorm = denormalizeFromLegs(
            data.purchaseLegs,
            lineSalesAmounts,
            data.salesAmount,
            data.exemptAmount,
            salesOnlyTripFromSingle(data)
        );
        const amountReceived = resolveAmountReceived(
            data.salesAmount,
            data.receivedDate,
            data.amountReceived ?? Number(existing.amountReceived)
        );

        await db.purchaseLeg.deleteMany({ where: { transactionId: id } });

        const transaction = await db.transaction.update({
            where: { id },
            data: {
                passengerNames: data.passengerNames,
                partyName: data.partyName,
                purchasePartyName: denorm.purchasePartyName,
                sector: denorm.sector,
                salesDate: new Date(data.salesDate),
                salesDateBS: data.salesDateBS,
                purchaseInvoiceNo: denorm.purchaseInvoiceNo,
                purchaseDate: denorm.purchaseDate,
                purchaseDateBS: denorm.purchaseDateBS,
                purchaseAmount: denorm.purchaseAmount,
                salesAmount: denorm.salesAmount,
                exemptAmount: denorm.exemptAmount,
                taxableAmount: denorm.taxableAmount,
                vatAmount: denorm.vatAmount,
                receivedStatus: resolveReceivedStatusForSave(
                    data.receivedStatus,
                    amountReceived,
                    data.receivedDate
                ),
                amountReceived: toDecimal(amountReceived),
                paymentStatus: derivePaymentStatus(data.salesAmount, amountReceived),
                receivedDate: data.receivedDate ? new Date(data.receivedDate) : null,
                receiptNo: data.receiptNo || null,
                chequeNo: data.chequeNo || null,
                remarks: data.remarks || null,
                travelDate: denorm.travelDate,
                partyVatNo: data.partyVatNo || null,
                contactNo: data.contactNo || null,
                hsCode: data.hsCode || null,
                purchaseLegs: {
                    create: buildLegRows(data.purchaseLegs, lineSalesAmounts),
                },
            },
            include: { purchaseLegs: true },
        });

        await writeAuditLog({
            userId: auth.session.user.id,
            userName: auth.session.user.name,
            action: "UPDATE_BOOKING",
            entityType: "Transaction",
            entityId: id,
        });

        revalidatePaths(id);
        return { success: true, data: transaction };
    } catch (error: unknown) {
        console.error("Update booking error:", error);
        const message = publicErrorMessage(error, "Failed to update booking");
        return { success: false, error: message };
    }
}

export async function previewSalesBillNos(count: number) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]);
    if (!auth.ok) return { success: false, error: auth.error, billNos: [] as string[] };
    const safeCount = Math.max(1, Math.min(count, 10));
    const billNos = await peekSalesBillNos(safeCount);
    return { success: true, billNos };
}

function revalidatePaths(id: string) {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tickets");
    revalidatePath(`/dashboard/tickets/${id}`);
    revalidatePath("/dashboard/partners");
}
