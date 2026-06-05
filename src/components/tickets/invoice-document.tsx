import { numberToWords } from "@/lib/utils/number-to-words";
import { formatNumber } from "@/lib/utils/format-currency";
import {
    parsePassengers,
    formatInvoiceGuestLine,
    shouldUseCompactPassengerDisplay,
    formatCompactPassengerDisplay,
} from "@/lib/utils/parse-passengers";

type InvoiceTransaction = {
    passengerNames: string;
    partyName: string;
    sector: string;
    salesBillNo: string;
    salesDate: Date;
    travelDate: Date | null;
    taxableAmount: { toString(): string } | number;
    vatAmount: { toString(): string } | number;
    exemptAmount: { toString(): string } | number;
    partyVatNo: string | null;
    contactNo: string | null;
    chequeNo: string | null;
    hsCode: string | null;
};

export default function InvoiceDocument({
    tx,
    variant,
}: {
    tx: InvoiceTransaction;
    variant: "proforma" | "tax";
}) {
    const taxable = Number(tx.taxableAmount);
    const vat = Number(tx.vatAmount);
    const exempt = Number(tx.exemptAmount);
    const grandTotal = taxable + vat + exempt;
    const amountInWords = numberToWords(Math.round(grandTotal * 100) / 100);
    const passengers = parsePassengers(tx.passengerNames);
    const paxCount = Math.max(passengers.length, 1);
    const compactPassengers = shouldUseCompactPassengerDisplay(passengers);
    const guestLine = formatInvoiceGuestLine(passengers, tx.passengerNames);
    const companyVatNo = process.env.COMPANY_VAT_NO || "612345678";
    const title = variant === "tax" ? "TAX INVOICE" : "PERFORMA INVOICE";
    const showWatermark = variant === "proforma";

    return (
        <div className="w-full max-w-[800px] border border-slate-200 shadow-xl mx-auto bg-white p-8 font-serif text-black text-sm print:p-4 print:border-0 print:shadow-none relative overflow-hidden">
            {showWatermark && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.08] select-none rotate-[-35deg] overflow-hidden">
                    <div className="text-center">
                        <p className="text-7xl font-black uppercase tracking-[0.2em]">Confidential</p>
                        <p className="text-2xl font-bold uppercase mt-4">Internal Copy - Not to be shared with customer</p>
                    </div>
                </div>
            )}

            <div className="text-center mb-6">
                <h1 className="text-base font-bold tracking-wide">
                    BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.
                </h1>
                <p className="text-sm">Kirtipur, Kathmandu, Nepal</p>
                <h2 className="text-sm font-bold mt-1">{title}</h2>
            </div>

            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <span className="font-medium whitespace-nowrap">VAT NO:</span>
                    <div className="flex ml-1">
                        {companyVatNo.split("").map((digit, i) => (
                            <div
                                key={i}
                                className="w-6 h-7 border border-foreground flex items-center justify-center text-sm font-bold"
                            >
                                {digit}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">Date:</span>
                    <span className="inline-block w-40 border-b border-dotted border-foreground/40">
                        &nbsp;{tx.salesDate.toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-center">
                    <span className="w-28 font-medium shrink-0">Mr./Ms.</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-dotted border-foreground/40 font-bold">
                        &nbsp;{guestLine}
                    </span>
                </div>
                <div className="flex items-center">
                    <span className="w-28 font-medium shrink-0">Party Name</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{tx.partyName}</span>
                </div>
                {tx.chequeNo && (
                    <div className="flex items-center">
                        <span className="w-28 font-medium shrink-0">Cheque No</span>
                        <span className="mr-2">:</span>
                        <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{tx.chequeNo}</span>
                    </div>
                )}
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
                                <div
                                    key={i}
                                    className="w-6 h-7 border border-foreground flex items-center justify-center text-xs font-bold"
                                >
                                    {tx.partyVatNo?.[i] || ""}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium whitespace-nowrap">Invoice No.:</span>
                        <span className="inline-block w-32 border-b border-dotted border-foreground/40">
                            &nbsp;{tx.salesBillNo}
                        </span>
                    </div>
                </div>
                <div className="flex items-center">
                    <span className="w-28 font-medium shrink-0">H.S. Code</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 border-b border-dotted border-foreground/40">&nbsp;{tx.hsCode}</span>
                </div>
            </div>

            <table className="w-full border-collapse border border-foreground text-sm">
                <thead>
                    <tr>
                        <th className="border border-foreground px-2 py-2 text-left font-bold w-12" rowSpan={2}>
                            S.N.
                        </th>
                        <th className="border border-foreground px-2 py-2 text-left font-bold" rowSpan={2}>
                            Description
                        </th>
                        <th className="border border-foreground px-2 py-2 text-center font-bold w-14" rowSpan={2}>
                            Qty
                        </th>
                        <th className="border border-foreground px-2 py-2 text-center font-bold w-16" rowSpan={2}>
                            Rate
                        </th>
                        <th className="border border-foreground px-2 py-1 text-center font-bold" colSpan={2}>
                            Amount (NPR)
                        </th>
                    </tr>
                    <tr>
                        <th className="border border-foreground px-2 py-1 text-center font-bold w-24">(A) Taxable</th>
                        <th className="border border-foreground px-2 py-1 text-center font-bold w-28">(B) Non-Taxable</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border-l border-r border-foreground px-2 py-3 align-top font-bold text-center">
                            1
                        </td>
                        <td className="border-l border-r border-foreground px-2 py-3 align-top">
                            <div className="space-y-4">
                                <div>
                                    <p className="font-black text-sm uppercase">Sector: {tx.sector}</p>
                                    <p className="text-xs text-slate-600 font-bold">
                                        Flight Date: {tx.travelDate?.toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase border-b border-slate-100 pb-1">
                                        No of Pax: {paxCount} · Passengers
                                    </p>
                                    {compactPassengers ? (
                                        <div className="pl-2 border-l-2 border-slate-100">
                                            <p className="font-black text-slate-800 uppercase">
                                                {formatCompactPassengerDisplay(passengers, tx.passengerNames)}
                                            </p>
                                        </div>
                                    ) : (
                                        passengers.map((p, idx) => (
                                            <div key={idx} className="pl-2 border-l-2 border-slate-100">
                                                <p className="font-black text-slate-800">{p.name}</p>
                                                <p className="text-[10px] text-slate-500 font-bold tracking-tight">
                                                    Ticket NO: {p.ticketNo || "N/A"}
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </td>
                        <td className="border-l border-r border-foreground px-2 py-3 align-top text-center font-bold">
                            {passengers.length}
                        </td>
                        <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">
                            {formatNumber((taxable + exempt) / passengers.length)}
                        </td>
                        <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">
                            {formatNumber(taxable)}
                        </td>
                        <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">
                            {formatNumber(exempt)}
                        </td>
                    </tr>

                    <tr className="border-t border-foreground">
                        <td colSpan={3} className="border border-foreground px-4 py-3 text-sm align-top italic" rowSpan={5}>
                            <div className="leading-relaxed">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1 not-italic">
                                    Amount in Words:
                                </p>
                                <strong className="text-slate-900">{amountInWords}</strong>
                            </div>
                        </td>
                        <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">Subtotal</td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNumber(taxable)}</td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNumber(exempt)}</td>
                    </tr>
                    <tr>
                        <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">Discount</td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNumber(0)}</td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNumber(0)}</td>
                    </tr>
                    <tr>
                        <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">Taxable Amt</td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold bg-slate-50">
                            {formatNumber(taxable)}
                        </td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNumber(0)}</td>
                    </tr>
                    <tr>
                        <td className="border border-foreground px-2 py-1 text-xs font-bold uppercase">VAT (13%)</td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold bg-slate-50">
                            {formatNumber(vat)}
                        </td>
                        <td className="border border-foreground px-2 py-1 text-right font-bold">{formatNumber(0)}</td>
                    </tr>
                    <tr className="border-t border-foreground">
                        <td className="border border-foreground px-2 py-2 text-xs font-black uppercase bg-slate-900 text-white leading-tight">
                            Grand Total (NPR)
                        </td>
                        <td
                            colSpan={2}
                            className="border border-foreground px-2 py-2 text-center text-xl font-black text-slate-900"
                        >
                            &nbsp; {formatNumber(grandTotal)}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="flex justify-between mt-16 px-4">
                <div className="text-center">
                    <div className="border-b border-dotted border-foreground/40 w-56 mb-1">&nbsp;Samir J khadka</div>
                    <span className="text-sm font-medium">BRICS TRAVEL AND TOURS Pvt. Ltd.</span>
                </div>
                <div className="text-center">
                    <div className="border-b border-dotted border-foreground/40 w-40 mb-1">&nbsp;</div>
                    <span className="text-sm font-medium">Buyer&apos;s Signature</span>
                </div>
            </div>
        </div>
    );
}
