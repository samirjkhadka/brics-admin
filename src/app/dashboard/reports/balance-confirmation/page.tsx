import db from "@/lib/db";
import { RoleGate } from "@/components/auth/role-gate";
import { Role, FiscalYearStatus } from "@prisma/client";
import { getPartyLedgerSummary } from "@/lib/ledger/party-ledger";
import { formatNPR } from "@/lib/utils/format-currency";
import Link from "next/link";
import { Suspense } from "react";
import { FileText } from "lucide-react";
import BalanceConfirmationFilters from "@/components/reports/balance-confirmation-filters";
import ViewSampleLink from "@/components/reports/view-sample-link";

export default async function BalanceConfirmationPage({
    searchParams,
}: {
    searchParams: Promise<{ fy?: string; party?: string }>;
}) {
    const { fy: fyId, party: partyParam } = await searchParams;
    const years = await db.financialYear.findMany({ orderBy: { startDateAD: "desc" } });
    const selected =
        (fyId ? years.find((y) => y.id === fyId) : null) ||
        years.find((y) => y.status === FiscalYearStatus.OPEN) ||
        years[0];

    const summaries = selected ? await getPartyLedgerSummary(selected.id) : [];
    const partyNames = summaries.map((s) => s.partyName).sort((a, b) => a.localeCompare(b));
    const selectedParty = partyParam ? decodeURIComponent(partyParam) : "";
    const visibleSummaries = selectedParty
        ? summaries.filter((s) => s.partyName === selectedParty)
        : summaries;

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Balance Confirmation</h1>
                        <p className="text-sm text-slate-500 mt-1">Year-end party balances for buying parties (customers)</p>
                    </div>
                    <ViewSampleLink href="/dashboard/reports/balance-confirmation/sample" />
                </div>

                <Suspense fallback={<div className="h-10 bg-slate-100 rounded-lg animate-pulse w-96" />}>
                    <BalanceConfirmationFilters
                        years={JSON.parse(JSON.stringify(years))}
                        selectedFyId={selected?.id}
                        parties={partyNames}
                        selectedParty={selectedParty}
                    />
                </Suspense>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <th className="px-4 py-3 text-left">Party</th>
                                <th className="px-4 py-3 text-right">Opening</th>
                                <th className="px-4 py-3 text-right">Billed</th>
                                <th className="px-4 py-3 text-right">Received</th>
                                <th className="px-4 py-3 text-right">Closing</th>
                                <th className="px-4 py-3 text-center">Print</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {visibleSummaries.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 text-sm italic">
                                        No parties found for this filter.
                                    </td>
                                </tr>
                            )}
                            {visibleSummaries.map((s) => (
                                <tr key={s.partyName} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-semibold">{s.partyName}</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatNPR(s.openingBalance)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatNPR(s.totalBilled)}</td>
                                    <td className="px-4 py-3 text-right font-mono">{formatNPR(s.totalReceived)}</td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">{formatNPR(s.closingBalance)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <Link
                                            href={`/dashboard/reports/balance-confirmation/print?fy=${selected?.id}&party=${encodeURIComponent(s.partyName)}`}
                                            className="inline-flex items-center gap-1 text-brand-red hover:underline text-xs font-bold"
                                        >
                                            <FileText size={14} /> Letter
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </RoleGate>
    );
}
