import db from "@/lib/db";
import { RoleGate } from "@/components/auth/role-gate";
import { Role, FiscalYearStatus } from "@prisma/client";
import { getPartyLedgerSummary, getSupplierStatement } from "@/lib/ledger/party-ledger";
import { formatNPR } from "@/lib/utils/format-currency";
import Link from "next/link";
import FySelect from "@/components/reports/fy-select";
import ViewSampleLink from "@/components/reports/view-sample-link";
import SupplierStatementTable from "@/components/reports/supplier-statement-table";
import { getSession } from "@/lib/auth/session";

export default async function StatementsPage({
    searchParams,
}: {
    searchParams: Promise<{ fy?: string; tab?: string }>;
}) {
    const { fy: fyId, tab } = await searchParams;
    const session = await getSession();
    const canEdit =
        session?.user?.role === Role.SUPERADMIN || session?.user?.role === Role.ADMIN;

    const years = await db.financialYear.findMany({ orderBy: { startDateAD: "desc" } });
    const selected =
        (fyId ? years.find((y) => y.id === fyId) : null) ||
        years.find((y) => y.status === FiscalYearStatus.OPEN) ||
        years[0];

    const activeTab = tab === "supplier" ? "supplier" : "customer";
    const customerData = selected ? await getPartyLedgerSummary(selected.id) : [];
    const supplierData = selected ? await getSupplierStatement(selected.id) : [];

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-3xl font-black text-slate-900">Statements</h1>
                    <ViewSampleLink href="/dashboard/reports/statements/sample" />
                </div>
                <div className="flex flex-wrap gap-4 items-center">
                    <FySelect years={JSON.parse(JSON.stringify(years))} selectedId={selected?.id} basePath="/dashboard/reports/statements" />
                    <div className="flex gap-2">
                        <a href={`?fy=${selected?.id}&tab=customer`} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === "customer" ? "bg-brand-red text-white" : "bg-slate-100"}`}>Customers</a>
                        <a href={`?fy=${selected?.id}&tab=supplier`} className={`px-4 py-2 rounded-lg text-sm font-bold ${activeTab === "supplier" ? "bg-brand-red text-white" : "bg-slate-100"}`}>Suppliers</a>
                    </div>
                </div>

                {activeTab === "customer" ? (
                    <table className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-right">Bills</th>
                                <th className="px-4 py-3 text-right">Billed</th>
                                <th className="px-4 py-3 text-right">Received</th>
                                <th className="px-4 py-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {customerData.map((s) => (
                                <tr key={s.partyName} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold">{s.partyName}</td>
                                    <td className="px-4 py-3 text-right">
                                        <Link
                                            href={`/dashboard/tickets?party=${encodeURIComponent(s.partyName)}`}
                                            className="font-bold text-brand-red hover:underline"
                                            title="View bills in All Transactions"
                                        >
                                            {s.billCount}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono">{formatNPR(s.totalBilled)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatNPR(s.totalReceived)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold">{formatNPR(s.closingBalance)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : selected ? (
                    <SupplierStatementTable
                        rows={supplierData}
                        fiscalYearId={selected.id}
                        canEdit={canEdit}
                    />
                ) : null}
            </div>
        </RoleGate>
    );
}
