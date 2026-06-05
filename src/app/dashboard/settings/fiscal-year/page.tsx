import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import { FiscalYearStatus } from "@prisma/client";
import FiscalYearClient from "@/components/settings/fiscal-year-client";

export default async function FiscalYearSettingsPage() {
    const [active, all] = await Promise.all([
        db.financialYear.findFirst({
            where: { status: FiscalYearStatus.OPEN },
            orderBy: { startDateAD: "desc" },
        }),
        db.financialYear.findMany({ orderBy: { startDateAD: "desc" } }),
    ]);

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900">Financial Year</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Nepal FY (Shrawan 1 – Ashad end). Bill numbers use BS prefix e.g. 2083-001.
                    </p>
                </div>
                <FiscalYearClient
                    active={active ? JSON.parse(JSON.stringify(active)) : null}
                    allYears={JSON.parse(JSON.stringify(all))}
                />
            </div>
        </RoleGate>
    );
}
