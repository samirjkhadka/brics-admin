import Link from "next/link";
import { PartyLedgerLine } from "@/lib/ledger/party-ledger";
import { formatNPR } from "@/lib/utils/format-currency";

function BillLink({ billNo, transactionId }: { billNo: string; transactionId?: string | null }) {
    const href = transactionId
        ? `/dashboard/tickets/${transactionId}`
        : `/dashboard/tickets?search=${encodeURIComponent(billNo)}`;
    return (
        <Link href={href} className="font-mono font-bold text-brand-red hover:underline">
            {billNo}
        </Link>
    );
}

function formatReferenceCell(line: PartyLedgerLine) {
    if (line.voucherType === "Opening") {
        return <span>Opening Balance</span>;
    }

    if (line.voucherType === "Sales") {
        return (
            <div className="space-y-0.5">
                <div>
                    Bill{" "}
                    <BillLink
                        billNo={line.billNo || line.reference}
                        transactionId={line.transactionId}
                    />
                </div>
                {line.passengerNames && <div className="text-slate-600">{line.passengerNames}</div>}
                {line.travelDateAD && (
                    <div className="text-slate-500 text-xs">
                        Travel: {line.travelDateAD}
                        {line.travelDateBS && <span> ({line.travelDateBS} BS)</span>}
                    </div>
                )}
            </div>
        );
    }

    if (line.voucherType === "Credit Note" || line.voucherType === "Refund") {
        return (
            <div className="space-y-0.5">
                <div>{line.reference}</div>
                {line.linkedBillNos.length > 0 && (
                    <div className="text-xs text-slate-500 flex flex-wrap gap-1 items-center">
                        <span>Bill</span>
                        {line.linkedBillNos.map((billNo, idx) => (
                            <span key={billNo}>
                                {idx > 0 && ", "}
                                <BillLink billNo={billNo} transactionId={line.transactionId} />
                            </span>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-0.5">
            <div className="font-mono font-semibold">{line.receiptNo || line.reference}</div>
            {line.linkedBillNos.length > 0 && (
                <div className="text-xs text-slate-500 flex flex-wrap gap-1 items-center">
                    <span>Against bills</span>
                    {line.linkedBillNos.map((billNo, idx) => (
                        <span key={billNo}>
                            {idx > 0 && ", "}
                            <BillLink billNo={billNo} />
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function LedgerDetailTable({ lines }: { lines: PartyLedgerLine[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-slate-300 mb-6 min-w-[720px]">
                <thead>
                    <tr className="bg-slate-100 text-[10px] uppercase tracking-wide">
                        <th className="border border-slate-300 px-2 py-2 text-left whitespace-nowrap">Date (BS)</th>
                        <th className="border border-slate-300 px-2 py-2 text-left whitespace-nowrap">Date (AD)</th>
                        <th className="border border-slate-300 px-2 py-2 text-left">Voucher Type</th>
                        <th className="border border-slate-300 px-2 py-2 text-left min-w-[200px]">Reference</th>
                        <th className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">Debit</th>
                        <th className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">Credit</th>
                        <th className="border border-slate-300 px-2 py-2 text-right whitespace-nowrap">Balance</th>
                    </tr>
                </thead>
                <tbody>
                    {lines.map((line, i) => (
                        <tr key={i}>
                            <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap text-slate-700">
                                {line.dateBS}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 whitespace-nowrap">
                                {line.voucherType === "Opening" ? "—" : line.date.toLocaleDateString()}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 font-semibold whitespace-nowrap">
                                {line.voucherType}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 align-top">
                                {formatReferenceCell(line)}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 text-right whitespace-nowrap">
                                {line.debit ? formatNPR(line.debit) : ""}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 text-right whitespace-nowrap">
                                {line.credit ? formatNPR(line.credit) : ""}
                            </td>
                            <td className="border border-slate-300 px-2 py-1.5 text-right font-semibold whitespace-nowrap">
                                {formatNPR(line.balance)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
