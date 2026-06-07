import Link from "next/link";
import { formatNPR } from "@/lib/utils/format-currency";

type LinkedTx = {
    id: string;
    salesBillNo: string;
    sector: string;
    salesAmount: { toString(): string } | number;
    isVoided: boolean;
};

export default function LinkedBookingsCard({
    currentId,
    transactions,
}: {
    currentId: string;
    transactions: LinkedTx[];
}) {
    if (transactions.length <= 1) return null;

    return (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 space-y-3">
            <div>
                <p className="text-sm font-black text-violet-900">Linked booking group</p>
                <p className="text-xs text-violet-700 mt-1">
                    These sales bills were created together as separate invoices for the same trip.
                </p>
            </div>
            <div className="grid gap-2">
                {transactions.map((tx) => (
                    <Link
                        key={tx.id}
                        href={`/dashboard/tickets/${tx.id}`}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                            tx.id === currentId
                                ? "bg-white border-violet-300 ring-1 ring-violet-200"
                                : "bg-white/70 border-violet-100 hover:border-violet-300"
                        }`}
                    >
                        <div>
                            <p className="font-mono font-bold text-brand-red">#{tx.salesBillNo}</p>
                            <p className="text-xs text-slate-500">{tx.sector}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-slate-900">{formatNPR(Number(tx.salesAmount))}</p>
                            {tx.isVoided && (
                                <p className="text-[10px] font-bold uppercase text-slate-400">Voided</p>
                            )}
                            {tx.id === currentId && (
                                <p className="text-[10px] font-bold uppercase text-violet-600">Current</p>
                            )}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
