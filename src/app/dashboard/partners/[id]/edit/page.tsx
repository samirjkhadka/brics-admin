import { notFound } from "next/navigation";
import { enforcePageRole, RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import PartnerForm from "@/components/partners/partner-form";

export default async function EditPartnerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await enforcePageRole([Role.SUPERADMIN]);

    const { id } = await params;
    const partner = await db.partner.findUnique({ where: { id } });

    if (!partner) notFound();

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="space-y-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900">Edit Partner</h1>
                <PartnerForm
                    initialData={{
                        id: partner.id,
                        name: partner.name,
                        type: partner.type,
                        entityType: partner.entityType,
                        contactPerson: partner.contactPerson || "",
                        contactNo: partner.contactNo || "",
                        email: partner.email || "",
                        vatNo: partner.vatNo || "",
                        address: partner.address || "",
                        remarks: partner.remarks || "",
                        isActive: partner.isActive,
                    }}
                />
            </div>
        </RoleGate>
    );
}
