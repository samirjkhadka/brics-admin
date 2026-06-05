import db from "@/lib/db";
import { PartnerType, Role } from "@prisma/client";
import { notFound } from "next/navigation";
import TicketEntryForm from "@/components/tickets/ticket-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RoleGate } from "@/components/auth/role-gate";

export default async function EditTransactionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [tx, partners] = await Promise.all([
        db.transaction.findUnique({ where: { id } }),
        db.partner.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true, vatNo: true, contactNo: true, bankName: true },
        }),
    ]);

    if (!tx) notFound();

    const customerPartners = partners.filter((p) => p.type === PartnerType.CUSTOMER);
    const supplierPartners = partners.filter((p) => p.type === PartnerType.SUPPLIER);

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN]}>
        <div className="space-y-6">
            <div className="max-w-5xl mx-auto px-4 pt-8">
                <Link
                    href="/dashboard/tickets"
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Registry
                </Link>
            </div>
            <TicketEntryForm
                customerPartners={JSON.parse(JSON.stringify(customerPartners))}
                supplierPartners={JSON.parse(JSON.stringify(supplierPartners))}
                initialData={JSON.parse(
                    JSON.stringify({
                        ...tx,
                        purchaseAmount: Number(tx.purchaseAmount),
                        salesAmount: Number(tx.salesAmount),
                        exemptAmount: Number(tx.exemptAmount),
                    })
                )}
            />
        </div>
        </RoleGate>
    );
}
