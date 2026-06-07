"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartnerType, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { partnerSchema } from "@/lib/validations/partner";
import { publicErrorMessage } from "@/lib/security/sanitize-error";

export async function listPartnersForEntry() {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const partners = await db.partner.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                type: true,
                vatNo: true,
                contactNo: true,
            },
        });
        return { success: true, data: partners };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to list partners");
        return { success: false, error: message };
    }
}

export async function listPartners() {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const partners = await db.partner.findMany({
            orderBy: { name: "asc" },
        });
        return { success: true, data: partners };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to list partners");
        return { success: false, error: message };
    }
}

export async function createPartner(formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = partnerSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const partner = await db.partner.create({
            data: {
                ...parsed.data,
                email: parsed.data.email || null,
            },
        });

        revalidatePath("/dashboard/partners");
        return { success: true, data: partner };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to create partner");
        return { success: false, error: message };
    }
}

export async function updatePartner(id: string, formData: unknown) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const parsed = partnerSchema.safeParse(formData);
        if (!parsed.success) {
            return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
        }

        const partner = await db.partner.update({
            where: { id },
            data: {
                ...parsed.data,
                email: parsed.data.email || null,
            },
        });

        revalidatePath("/dashboard/partners");
        revalidatePath(`/dashboard/partners/${id}/edit`);
        return { success: true, data: partner };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to update partner");
        return { success: false, error: message };
    }
}

export async function deletePartner(id: string) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const partner = await db.partner.findUnique({ where: { id } });
        if (!partner) return { success: false, error: "Partner not found" };

        await db.partner.delete({ where: { id } });

        revalidatePath("/dashboard/partners");
        return { success: true };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to delete partner");
        return { success: false, error: message };
    }
}

export async function bulkDeletePartners(ids: string[]) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    if (!ids.length) return { success: false, error: "No partners selected" };

    try {
        const result = await db.partner.deleteMany({
            where: { id: { in: ids } },
        });

        revalidatePath("/dashboard/partners");
        return { success: true, count: result.count };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to delete partners");
        return { success: false, error: message };
    }
}

export async function deactivatePartner(id: string) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        await db.partner.update({
            where: { id },
            data: { isActive: false },
        });

        revalidatePath("/dashboard/partners");
        return { success: true };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to deactivate partner");
        return { success: false, error: message };
    }
}

export async function getCustomerTicketDefaults(partnerId: string) {
    const auth = await requireRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const partner = await db.partner.findUnique({
            where: { id: partnerId, type: PartnerType.CUSTOMER },
            select: { id: true, name: true, vatNo: true, contactNo: true },
        });
        if (!partner) return { success: false, error: "Customer not found" };

        const lastTx = await db.transaction.findFirst({
            where: { partyName: partner.name, isVoided: false },
            orderBy: { createdAt: "desc" },
            select: { partyVatNo: true, contactNo: true, hsCode: true },
        });

        return {
            success: true,
            data: {
                partyVatNo: partner.vatNo || lastTx?.partyVatNo || "",
                contactNo: partner.contactNo || lastTx?.contactNo || "",
                hsCode: lastTx?.hsCode || "",
            },
        };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to load customer details");
        return { success: false, error: message };
    }
}

export async function getPartnerById(id: string) {
    const auth = await requireRole([Role.SUPERADMIN]);
    if (!auth.ok) return { success: false, error: auth.error };

    try {
        const partner = await db.partner.findUnique({ where: { id } });
        if (!partner) {
            return { success: false, error: "Partner not found" };
        }
        return { success: true, data: partner };
    } catch (error: unknown) {
        const message = publicErrorMessage(error, "Failed to fetch partner");
        return { success: false, error: message };
    }
}
