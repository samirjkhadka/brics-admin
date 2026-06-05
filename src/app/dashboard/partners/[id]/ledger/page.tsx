import { notFound } from "next/navigation";
import { RoleGate } from "@/components/auth/role-gate";
import { Role, FiscalYearStatus } from "@prisma/client";
import db from "@/lib/db";
import PartnerLedgerForm from "@/components/partners/partner-ledger-form";

export default async function PartnerLedgerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const partner = await db.partner.findUnique({ where: { id } });
    if (!partner) notFound();

    const activeFy = await db.financialYear.findFirst({
        where: { status: FiscalYearStatus.OPEN },
    });

    const balance = activeFy
        ? await db.partnerFiscalBalance.findUnique({
              where: { partnerId_fiscalYearId: { partnerId: id, fiscalYearId: activeFy.id } },
          })
        : null;

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="max-w-lg mx-auto space-y-6">
                <h1 className="text-2xl font-black">Opening Balance — {partner.name}</h1>
                {activeFy ? (
                    <PartnerLedgerForm
                        partnerId={id}
                        fiscalYearId={activeFy.id}
                        fyLabel={activeFy.label}
                        openingBalance={balance ? Number(balance.openingBalance) : 0}
                    />
                ) : (
                    <p className="text-slate-500">No active financial year. Initialize from Settings → Financial Year.</p>
                )}
            </div>
        </RoleGate>
    );
}
