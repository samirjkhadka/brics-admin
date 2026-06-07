import Link from "next/link";
import { Plus } from "lucide-react";
import { enforcePageRole, RoleGate } from "@/components/auth/role-gate";
import { PartnerType, Role } from "@prisma/client";
import db from "@/lib/db";
import PartnersTable from "@/components/partners/partners-table";
import PartnersFilter from "@/components/partners/partners-filter";
import { Suspense } from "react";

export default async function PartnersPage({
    searchParams,
}: {
    searchParams: Promise<{ type?: string }>;
}) {
    await enforcePageRole([Role.SUPERADMIN]);

    const { type } = await searchParams;

    const where =
        type === "INCOMPLETE"
            ? { bankName: "Pending" }
            : type === PartnerType.SUPPLIER
              ? { type: PartnerType.SUPPLIER }
              : type === PartnerType.CUSTOMER
                ? { type: PartnerType.CUSTOMER }
                : {};

    const partners = await db.partner.findMany({
        where,
        orderBy: { name: "asc" },
    });

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="space-y-6 max-w-6xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Partners</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage suppliers and customers</p>
                    </div>
                    <Link
                        href="/dashboard/partners/new"
                        className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} /> Add Partner
                    </Link>
                </div>
                <Suspense fallback={null}>
                    <PartnersFilter />
                </Suspense>
                <PartnersTable partners={JSON.parse(JSON.stringify(partners))} />
            </div>
        </RoleGate>
    );
}
