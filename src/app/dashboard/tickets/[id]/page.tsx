import db from "@/lib/db";
import { notFound } from "next/navigation";
import { Download, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { formatNPR } from "@/lib/utils/format-currency";
import { TransactionActions } from "@/components/tickets/transaction-actions";

export default async function TransactionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const tx = await db.transaction.findUnique({
        where: { id: id },
    });

    if (!tx) notFound();

    const passengers = (() => {
        try {
            const parsed = JSON.parse(tx.passengerNames);
            return Array.isArray(parsed) ? parsed : [{ name: tx.passengerNames, ticketNo: "" }];
        } catch {
            return [{ name: tx.passengerNames, ticketNo: "" }];
        }
    })();

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <Link
                    href="/dashboard/tickets"
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Registry
                </Link>
                <div className="flex gap-4">
                    <TransactionActions id={tx.id} salesBillNo={tx.salesBillNo} />
                    <Link
                        href={`/dashboard/tickets/${tx.id}/bill`}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl border border-slate-200 font-bold transition-all shadow-sm"
                    >
                        <Printer size={18} />
                        Detailed Bill
                    </Link>
                    <a
                        href={`/api/export/pdf/${tx.id}`}
                        className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-lg shadow-brand-red/20 active:scale-95"
                    >
                        <Download size={18} />
                        Download PDF
                    </a>
                </div>
            </div>

            {/* Tax Invoice Digital Version */}
            <div className="bg-white text-slate-900 px-12 py-16 rounded-3xl shadow-xl min-h-[900px] border border-slate-200">
                <div className="flex justify-between items-start border-b-2 border-slate-100 pb-10 mb-10">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Tax Invoice</h1>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-none">Internal Digital Copy</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-black text-slate-900">BRICS WORLD TRAVEL</h2>
                        <p className="text-sm text-slate-500 font-medium">Kathmandu, Nepal</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-12 mb-12">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Information</p>
                            <p className="text-lg font-black text-slate-900">{tx.partyName}</p>
                            <p className="text-sm text-slate-600 font-medium mt-1">VAT No: <span className="text-slate-900">{tx.partyVatNo || "N/A"}</span></p>
                            <p className="text-sm text-slate-600 font-medium">Contact: <span className="text-slate-900">{tx.contactNo || "N/A"}</span></p>
                        </div>
                    </div>
                    <div className="text-right space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Details</p>
                            <p className="text-lg font-black text-slate-900">#{tx.salesBillNo}</p>
                            <p className="text-sm text-slate-600 font-medium mt-1">Date (BS): <span className="text-slate-900">{tx.salesDateBS}</span></p>
                            <p className="text-sm text-slate-600 font-medium">Date (AD): <span className="text-slate-900">{tx.salesDate.toLocaleDateString()}</span></p>
                        </div>
                    </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden mb-12">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-500">Sector</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr>
                                <td className="px-6 py-8">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-black text-slate-900 uppercase">Air Ticket</p>
                                            <p className="text-xs text-slate-400 font-medium mt-1 italic">Travel Date: {tx.travelDate?.toLocaleDateString() || "N/A"}</p>
                                        </div>
                                        <div className="space-y-2">
                                            {passengers.map((p, idx) => (
                                                <div key={idx} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                    <p className="font-black text-slate-800 text-sm">{p.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Ticket: {p.ticketNo || "N/A"}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-8 text-center font-bold text-slate-700">{tx.sector}</td>
                                <td className="px-6 py-8 text-right font-black text-slate-900">{formatNPR(tx.salesAmount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <div className="w-80 space-y-3 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Taxable Amount</span>
                            <span className="text-slate-900">{formatNPR(tx.taxableAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">VAT (13%)</span>
                            <span className="text-slate-900">{formatNPR(tx.vatAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xl border-t border-slate-200 pt-4 mt-2">
                            <span className="font-black text-brand-red">Total</span>
                            <span className="font-black text-slate-900 underline decoration-brand-red underline-offset-8">{formatNPR(tx.salesAmount)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-24 flex justify-between items-end px-4">
                    <div className="text-center space-y-3">
                        <div className="w-48 border-b-2 border-slate-100 mx-auto"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer Signature</p>
                    </div>
                    <div className="text-center space-y-3">
                        <div className="w-48 border-b-2 border-slate-100 mx-auto"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Authorized Signatory</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
