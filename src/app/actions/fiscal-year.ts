"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { FiscalYearStatus, PartnerType, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit/log";
import { getPartyLedgerSummary } from "@/lib/ledger/party-ledger";
import {
    ensureActiveFinancialYear,
    getActiveFinancialYear,
    peekNextSalesBillNo,
} from "@/lib/fiscal-year/service";
import { getFiscalYearBounds } from "@/lib/fiscal-year/nepal-fy";
import {
    previewBillFormat,
    validateBillFormat,
    DEFAULT_BILL_FORMAT,
    DEFAULT_RECEIPT_FORMAT,
} from "@/lib/fiscal-year/bill-format";
import { z } from "zod";

export async function getFiscalYearOverview() {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]);
    if (!auth.ok) return { success: false, error: auth.error };

    const active = await getActiveFinancialYear();
    const all = await db.financialYear.findMany({ orderBy: { startDateAD: "desc" } });

    return {
        success: true,
        data: {
            active,
            all,
            nextBillPreview: active ? await peekNextSalesBillNo() : null,
        },
    };
}

export async function updatePartnerOpeningBalance(
    partnerId: string,
    fiscalYearId: string,
    openingBalance: number
) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    await db.partnerFiscalBalance.upsert({
        where: { partnerId_fiscalYearId: { partnerId, fiscalYearId } },
        create: { partnerId, fiscalYearId, openingBalance },
        update: { openingBalance },
    });

    revalidatePath("/dashboard/partners");
    revalidatePath("/dashboard/reports/balance-confirmation");
    return { success: true };
}

export async function closeFinancialYear() {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const active = await getActiveFinancialYear();
    if (!active) return { success: false, error: "No active financial year" };
    if (active.status !== FiscalYearStatus.OPEN) {
        return { success: false, error: "Financial year is already closed" };
    }

    const summaries = await getPartyLedgerSummary(active.id);

    for (const s of summaries) {
        if (!s.partnerId) continue;
        await db.partnerFiscalBalance.upsert({
            where: {
                partnerId_fiscalYearId: {
                    partnerId: s.partnerId,
                    fiscalYearId: active.id,
                },
            },
            create: {
                partnerId: s.partnerId,
                fiscalYearId: active.id,
                openingBalance: s.openingBalance,
                closingBalance: s.closingBalance,
            },
            update: { closingBalance: s.closingBalance },
        });
    }

    await db.financialYear.update({
        where: { id: active.id },
        data: {
            status: FiscalYearStatus.CLOSED,
            closedAt: new Date(),
            closedById: auth.session.user.id,
        },
    });

    const nextBsStart = active.bsYearStart + 1;
    const bounds = getFiscalYearBounds(nextBsStart);

    const newFy = await db.financialYear.create({
        data: {
            label: bounds.label,
            bsYearStart: bounds.bsYearStart,
            billPrefixYear: bounds.billPrefixYear,
            startDateAD: bounds.startDateAD,
            endDateAD: bounds.endDateAD,
            startDateBS: bounds.startDateBS,
            endDateBS: bounds.endDateBS,
            status: FiscalYearStatus.OPEN,
            nextBillSeq: 1,
            nextReceiptSeq: 1,
            billNoFormat: active.billNoFormat || DEFAULT_BILL_FORMAT,
            receiptNoFormat: active.receiptNoFormat || DEFAULT_RECEIPT_FORMAT,
        },
    });

    const customers = await db.partner.findMany({
        where: { type: PartnerType.CUSTOMER, isActive: true },
    });

    for (const partner of customers) {
        const summary = summaries.find((s) => s.partnerId === partner.id);
        const opening = summary?.closingBalance ?? 0;
        if (opening !== 0) {
            await db.partnerFiscalBalance.create({
                data: {
                    partnerId: partner.id,
                    fiscalYearId: newFy.id,
                    openingBalance: opening,
                },
            });
        }
    }

    await writeAuditLog({
        userId: auth.session.user.id,
        userName: auth.session.user.name,
        action: "CLOSE_FY",
        entityType: "FinancialYear",
        entityId: active.id,
        metadata: { closedLabel: active.label, newLabel: newFy.label },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tickets");
    revalidatePath("/dashboard/settings/fiscal-year");
    revalidatePath("/dashboard/reports/balance-confirmation");

    return {
        success: true,
        data: { closed: active.label, opened: newFy.label },
    };
}

export async function ensureFiscalYearBootstrap() {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const fy = await ensureActiveFinancialYear();
    return { success: true, data: fy };
}

const billSettingsSchema = z.object({
    fiscalYearId: z.string(),
    billNoFormat: z.string().min(1),
    receiptNoFormat: z.string().min(1),
    nextBillSeq: z.coerce.number().int().min(1).max(999999),
    nextReceiptSeq: z.coerce.number().int().min(1).max(999999),
});

export async function updateFiscalYearBillSettings(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    const parsed = billSettingsSchema.safeParse(formData);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const billErr = validateBillFormat(parsed.data.billNoFormat);
    if (billErr) return { success: false, error: `Bill format: ${billErr}` };

    const receiptErr = validateBillFormat(parsed.data.receiptNoFormat);
    if (receiptErr) return { success: false, error: `Receipt format: ${receiptErr}` };

    const fy = await db.financialYear.findUnique({ where: { id: parsed.data.fiscalYearId } });
    if (!fy) return { success: false, error: "Financial year not found" };
    if (fy.status !== FiscalYearStatus.OPEN) {
        return { success: false, error: "Can only edit bill settings on the open financial year" };
    }

    const updated = await db.financialYear.update({
        where: { id: fy.id },
        data: {
            billNoFormat: parsed.data.billNoFormat.trim(),
            receiptNoFormat: parsed.data.receiptNoFormat.trim(),
            nextBillSeq: parsed.data.nextBillSeq,
            nextReceiptSeq: parsed.data.nextReceiptSeq,
        },
    });

    await writeAuditLog({
        userId: auth.session.user.id,
        userName: auth.session.user.name,
        action: "UPDATE_FY_BILL_FORMAT",
        entityType: "FinancialYear",
        entityId: fy.id,
        metadata: {
            billNoFormat: updated.billNoFormat,
            nextBillSeq: updated.nextBillSeq,
            nextBillPreview: previewBillFormat(
                updated.billNoFormat,
                updated.billPrefixYear,
                updated.nextBillSeq
            ),
        },
    });

    revalidatePath("/dashboard/settings/fiscal-year");
    revalidatePath("/dashboard/tickets/new");

    return {
        success: true,
        data: {
            nextBillPreview: previewBillFormat(
                updated.billNoFormat,
                updated.billPrefixYear,
                updated.nextBillSeq
            ),
        },
    };
}
