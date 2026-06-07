import db from "@/lib/db";
import { PartnerType } from "@prisma/client";

const PLACEHOLDER_SKIP = new Set(["", "unspecified", "legacy import", "not specified", "own"]);

/** Internal helper — not a server action; call only from authenticated actions. */
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
}
