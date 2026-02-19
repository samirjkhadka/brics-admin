import db from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/tickets/print-button";
import { numberToWords } from "@/lib/utils/number-to-words";
import { formatNPR } from "@/lib/utils/format-currency";

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tx = await db.transaction.findUnique({
        where: { id },
    });

    if (!tx) notFound();

    const grandTotal = tx.taxableAmount + tx.vatAmount + tx.exemptAmount;
    const amountInWords = numberToWords(Math.round(grandTotal * 100) / 100);

    const passengers = (() => {
        try {
            const parsed = JSON.parse(tx.passengerNames);
            return Array.isArray(parsed) ? parsed : [{ name: tx.passengerNames, ticketNo: "" }];
        } catch {
            return [{ name: tx.passengerNames, ticketNo: "" }];
        }
    })();

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white text-black">
            {/* Header Controls */}
            <div className="max-w-[850px] mx-auto mb-8 flex justify-between items-center print:hidden">
                <Link href="/dashboard/tickets" className="text-slate-500 hover:text-brand-red flex items-center gap-2 text-sm transition-colors font-semibold">
                    <ArrowLeft size={16} /> Back to Registry
                </Link>
                <PrintButton />
            </div>

            <div className="w-full max-w-[800px] border border-slate-200 shadow-xl mx-auto bg-white p-8 font-serif text-black text-sm print:p-4 print:border-0 print:shadow-none">
                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-base font-bold tracking-wide">
                        BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.
                    </h1>
                    <p className="text-sm">Kirtipur, Kathmandu, Nepal</p>
                    <h2 className="text-sm font-bold mt-1">TAX INVOICE</h2>
                </div>

                {/* VAT NO and Date row */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                        <span className="font-medium whitespace-nowrap">VAT NO:</span>
                        <div className="flex ml-1">
                            {"612345678".split("").map((digit, i) => (
                                <div key={i} className="w-6 h-7 border border-foreground flex items-center justify-center text-sm font-bold">
                                    {digit}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Date:</span>
                        <span className="inline-block w-40 border-b border-dotted border-foreground/40">&nbsp;{tx.salesDate.toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Customer Info */}
                <div className="space-y-3 mb-4">
                    <div className="flex items-center">
                        <span className="w-28 font-medium shrink-0">Mr./Ms.</span>
                        <span className="mr-2">:</span>
                        <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{passengers[0]?.name || tx.passengerNames}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-28 font-medium shrink-0">Party Name</span>
                        <span className="mr-2">:</span>
                        <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{tx.partyName}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-28 font-medium shrink-0">Contact No</span>
                        <span className="mr-2">:</span>
                        <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{tx.contactNo}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <span className="font-medium whitespace-nowrap">Party VAT NO. :</span>
                            <div className="flex ml-2">
                                {Array.from({ length: 9 }).map((_, i) => (
                                    <div key={i} className="w-6 h-7 border border-foreground flex items-center justify-center text-xs font-bold">
                                        {tx.partyVatNo?.[i] || ""}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-medium whitespace-nowrap">Invoice No.:</span>
                            <span className="inline-block w-32 border-b border-dotted border-foreground/40">&nbsp;{tx.salesBillNo}</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="w-28 font-medium shrink-0">H.S. Code</span>
                        <span className="mr-2">:</span>
                        <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{tx.hsCode}</span>
                    </div>
                </div>

                {/* Main Table with Summary */}
                <table className="w-full border-collapse border border-foreground text-sm">
                    <thead>
                        <tr>
                            <th className="border border-foreground px-2 py-2 text-left font-bold w-12" rowSpan={2}>S.N.</th>
                            <th className="border border-foreground px-2 py-2 text-left font-bold" rowSpan={2}>Description</th>
                            <th className="border border-foreground px-2 py-2 text-center font-bold w-14" rowSpan={2}>Qty</th>
                            <th className="border border-foreground px-2 py-2 text-center font-bold w-16" rowSpan={2}>Rate</th>
                            <th className="border border-foreground px-2 py-1 text-center font-bold" colSpan={2}>Amount</th>
                        </tr>
                        <tr>
                            <th className="border border-foreground px-2 py-1 text-center font-bold w-24">(A) Taxable</th>
                            <th className="border border-foreground px-2 py-1 text-center font-bold w-28">(B) Non-Taxable</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top font-bold text-center">1</td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top">
                                <div className="space-y-4">
                                    <div>
                                        <p className="font-black text-sm uppercase">Sector: {tx.sector}</p>
                                        <p className="text-xs text-slate-600 font-bold">Flight Date: {tx.travelDate?.toLocaleDateString()}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold uppercase border-b border-slate-100 pb-1">Passengers</p>
                                        {passengers.map((p, idx) => (
                                            <div key={idx} className="pl-2 border-l-2 border-slate-100">
                                                <p className="font-black text-slate-800">{p.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold tracking-tight">Ticket NO: {p.ticketNo || "N/A"}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-center font-bold">1</td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">{formatNPR(tx.salesAmount)}</td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">{formatNPR(tx.taxableAmount)}</td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">{formatNPR(tx.exemptAmount)}</td>
                        </tr>

                        {/* Summary rows inside table */}
                        <tr className="border-t border-foreground">
                            <td colSpan={3} className="border border-foreground px-4 py-3 text-sm align-top italic" rowSpan={5}>
                                <div className="leading-relaxed">
                                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 not-italic">Amount in Words:</p>
                                    <strong className="text-slate-900">{amountInWords}</strong>
                                </div>
                            </td>
                            <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">Subtotal</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNPR(tx.taxableAmount)}</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNPR(tx.exemptAmount)}</td>
                        </tr>
                        <tr>
                            <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">Discount</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNPR(0)}</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNPR(0)}</td>
                        </tr>
                        <tr>
                            <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">Taxable Amt</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold bg-slate-50">{formatNPR(tx.taxableAmount)}</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNPR(0)}</td>
                        </tr>
                        <tr>
                            <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">VAT (13%)</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold bg-slate-50">{formatNPR(tx.vatAmount)}</td>
                            <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNPR(0)}</td>
                        </tr>
                        <tr className="border-t border-foreground">
                            <td className="border border-foreground px-2 py-2 text-xs font-black uppercase bg-slate-900 text-white">Grand Total</td>
                            <td colSpan={2} className="border border-foreground px-2 py-2 text-center text-xl font-black text-slate-900">&nbsp; {formatNPR(grandTotal)}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer Signatures */}
                <div className="flex justify-between mt-16 px-4">
                    <div className="text-center">
                        <div className="border-b border-dotted border-foreground/40 w-56 mb-1">&nbsp;Samir J khadka</div>
                        <span className="text-sm font-medium">BRICS TRAVEL AND TOURS Pvt. Ltd.</span>
                    </div>
                    <div className="text-center">
                        <div className="border-b border-dotted border-foreground/40 w-40 mb-1">&nbsp;</div>
                        <span className="text-sm font-medium">Buyer's Signature</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
