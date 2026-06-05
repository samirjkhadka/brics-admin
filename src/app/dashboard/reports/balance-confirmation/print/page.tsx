import db from "@/lib/db";
import { notFound } from "next/navigation";
import { getPartyLedgerLines } from "@/lib/ledger/party-ledger";
import { formatNPR } from "@/lib/utils/format-currency";
import PrintButton from "@/components/tickets/print-button";
import LedgerDetailTable from "@/components/reports/ledger-detail-table";

export default async function BalanceConfirmationPrintPage({
    searchParams,
}: {
    searchParams: Promise<{ fy?: string; party?: string }>;
}) {
    const { fy, party } = await searchParams;
    if (!fy || !party) notFound();

    const fiscalYear = await db.financialYear.findUnique({ where: { id: fy } });
    if (!fiscalYear) notFound();

    const lines = await getPartyLedgerLines(fy, decodeURIComponent(party));
    const closing = lines.length ? lines[lines.length - 1].balance : 0;

    return (
        <div className="min-h-screen bg-slate-50 p-8 print:bg-white">
            <div className="max-w-5xl mx-auto mb-4 print:hidden flex justify-end">
                <PrintButton />
            </div>
            <div className="max-w-5xl mx-auto bg-white border border-slate-200 p-10 shadow-lg print:shadow-none font-serif">
                <div className="text-center mb-8">
                    <h1 className="text-lg font-bold">BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.</h1>
                    <h2 className="text-sm font-black mt-4 uppercase">Balance Confirmation</h2>
                    <p className="text-sm mt-2">Financial Year: {fiscalYear.label}</p>
                </div>
                <p className="mb-6">
                    To: <strong>{decodeURIComponent(party)}</strong>
                </p>
                <p className="text-sm mb-6 leading-relaxed">
                    This is to confirm your account balance with BRICS World Travel for the financial year{" "}
                    {fiscalYear.label} ({fiscalYear.startDateBS} to {fiscalYear.endDateBS}).
                </p>
                <LedgerDetailTable lines={lines} />
                <p className="font-bold text-lg">Closing Balance: {formatNPR(closing)}</p>
                <p className="text-xs text-slate-500 mt-8">
                    Please confirm this balance within 15 days. Contact BRICS Accounts for discrepancies.
                </p>
            </div>
        </div>
    );
}
