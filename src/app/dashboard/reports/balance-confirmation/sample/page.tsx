import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import SamplePageShell from "@/components/reports/sample-page-shell";
import { SAMPLE_BALANCE_CONFIRMATION } from "@/lib/reports/sample-data";
import { formatNPR } from "@/lib/utils/format-currency";
import { PartyLedgerLine } from "@/lib/ledger/party-ledger";
import LedgerDetailTable from "@/components/reports/ledger-detail-table";

export default function BalanceConfirmationSamplePage() {
    const sample = SAMPLE_BALANCE_CONFIRMATION;

    const lines: PartyLedgerLine[] = sample.lines.map((line) => ({
        date: line.date === "—" ? new Date(0) : new Date(line.date),
        dateBS: line.dateBS,
        voucherType: line.voucherType,
        billNo: line.billNo ?? null,
        receiptNo: line.receiptNo ?? null,
        reference: line.reference,
        passengerNames: line.passengerNames,
        travelDateAD: line.travelDateAD,
        travelDateBS: line.travelDateBS,
        transactionId: null,
        linkedBillNos: line.linkedBillNos ?? (line.billNo ? [line.billNo.replace(/^#/, "")] : []),
        debit: line.debit,
        credit: line.credit,
        balance: line.balance,
    }));

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <SamplePageShell title="Balance Confirmation" backHref="/dashboard/reports/balance-confirmation">
                <div className="max-w-5xl mx-auto bg-white border border-slate-200 p-10 shadow-lg print:shadow-none font-serif">
                    <div className="text-center mb-8">
                        <h1 className="text-lg font-bold">BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.</h1>
                        <p className="text-sm">Kirtipur, Kathmandu, Nepal</p>
                        <h2 className="text-sm font-black mt-4 uppercase">Balance Confirmation</h2>
                        <p className="text-sm mt-2">Financial Year: {sample.fyLabel}</p>
                    </div>
                    <p className="mb-6">
                        To: <strong>{sample.partyName}</strong>
                    </p>
                    <p className="text-sm mb-6 leading-relaxed">
                        This is to confirm your account balance with BRICS World Travel for the financial year{" "}
                        {sample.fyLabel} ({sample.startDateBS} to {sample.endDateBS}).
                    </p>
                    <LedgerDetailTable lines={lines} />
                    <p className="font-bold text-lg">Closing Balance: {formatNPR(sample.closingBalance)}</p>
                    <p className="text-xs text-slate-500 mt-8">
                        Please confirm this balance within 15 days. Contact BRICS Accounts for discrepancies.
                    </p>
                </div>
            </SamplePageShell>
        </RoleGate>
    );
}
