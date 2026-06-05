"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { PartnerType, Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/session";
import { partnerSchema } from "@/lib/validations/partner";

const PLACEHOLDER_SKIP = new Set(["", "unspecified", "legacy import", "not specified"]);

/** Create or update a partner when entered via ticket form (custom combobox name). */
export async function upsertPartnerFromTicketEntry(data: {
    name: string;
    type: PartnerType;
    vatNo?: string | null;
    contactNo?: string | null;
}) {
    const name = data.name.trim();
    if (!name || PLACEHOLDER_SKIP.has(name.toLowerCase())) return;

    const existing = await db.partner.findUnique({
        where: { name_type: { name, type: data.type } },
    });

    if (existing) {
        await db.partner.update({
            where: { id: existing.id },
            data: {
                isActive: true,
                ...(data.vatNo?.trim() ? { vatNo: data.vatNo.trim() } : {}),
                ...(data.contactNo?.trim() ? { contactNo: data.contactNo.trim() } : {}),
            },
        });
        return;
    }

    await db.partner.create({
        data: {
            name,
            type: data.type,
            vatNo: data.vatNo?.trim() || null,
            contactNo: data.contactNo?.trim() || null,
            bankName: "Pending",
            accountNumber: "Pending",
        },
    });

    revalidatePath("/dashboard/partners");
}

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
        const message = error instanceof Error ? error.message : "Failed to list partners";
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
        const message = error instanceof Error ? error.message : "Failed to list partners";
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
        const message = error instanceof Error ? error.message : "Failed to create partner";
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
        const message = error instanceof Error ? error.message : "Failed to update partner";
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
        const message = error instanceof Error ? error.message : "Failed to deactivate partner";
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
        const message = error instanceof Error ? error.message : "Failed to fetch partner";
        return { success: false, error: message };
    }
}
