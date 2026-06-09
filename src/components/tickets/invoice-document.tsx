import { numberToWords } from "@/lib/utils/number-to-words";
import { formatNumber } from "@/lib/utils/format-currency";
import {
    parsePassengers,
    formatInvoiceGuestLine,
    shouldUseCompactPassengerDisplay,
    formatCompactPassengerDisplay,
} from "@/lib/utils/parse-passengers";
import { buildInvoiceLineItems } from "@/lib/booking/helpers";
import { formatDisplayDate } from "@/lib/utils/format-display-date";

type InvoiceLeg = {
    sector: string;
    lineSalesAmount: { toString(): string } | number;
    exemptAmount?: { toString(): string } | number;
    travelDate?: Date | null;
    ticketNo?: string | null;
};

type InvoiceTransaction = {
    passengerNames: string;
    partyName: string;
    sector: string;
    salesBillNo: string;
    salesDate: Date;
    travelDate: Date | null;
    salesAmount: { toString(): string } | number;
    taxableAmount: { toString(): string } | number;
    vatAmount: { toString(): string } | number;
    exemptAmount: { toString(): string } | number;
    partyVatNo: string | null;
    contactNo: string | null;
    chequeNo: string | null;
    hsCode: string | null;
    purchaseLegs?: InvoiceLeg[];
};

export default function InvoiceDocument({
    tx,
    variant,
}: {
    tx: InvoiceTransaction;
    variant: "proforma" | "tax";
}) {
    const salesAmount = Number(tx.salesAmount);
    const taxable = Number(tx.taxableAmount);
    const vat = Number(tx.vatAmount);
    const exempt = Number(tx.exemptAmount);
    const grandTotal = salesAmount || taxable + vat + exempt;
    const amountInWords = numberToWords(Math.round(grandTotal * 100) / 100);
    const passengers = parsePassengers(tx.passengerNames);
    const paxCount = Math.max(passengers.length, 1);
    const compactPassengers = shouldUseCompactPassengerDisplay(passengers);
    const guestLine = formatInvoiceGuestLine(passengers, tx.passengerNames);
    const companyVatNo = process.env.COMPANY_VAT_NO?.trim() || "";
    const title = variant === "tax" ? "TAX INVOICE" : "PERFORMA INVOICE";
    const showWatermark = variant === "proforma";
    const showVatNumbers = variant === "tax";

    const legSource =
        tx.purchaseLegs && tx.purchaseLegs.length > 0
            ? tx.purchaseLegs.map((leg) => ({
                  sector: leg.sector,
                  lineSalesAmount: Number(leg.lineSalesAmount),
                  exemptAmount: Number(leg.exemptAmount ?? 0),
                  travelDate: leg.travelDate ?? null,
                  ticketNo: leg.ticketNo ?? null,
              }))
            : [
                  {
                      sector: tx.sector,
                      lineSalesAmount: grandTotal,
                      travelDate: tx.travelDate,
                      ticketNo: null,
                  },
              ];

    const lineItems = buildInvoiceLineItems(legSource, exempt);
    const multiLeg = legSource.length > 1;

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
                {showVatNumbers && companyVatNo ? (
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
                ) : (
                    <span />
                )}
                <div className="flex items-center gap-2">
                    <span className="font-medium">Date:</span>
                    <span className="inline-block w-40 border-b border-dotted border-foreground/40">
                        &nbsp;{formatDisplayDate(tx.salesDate)}
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
                    {showVatNumbers ? (
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
                    ) : (
                        <span />
                    )}
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
                    {lineItems.map((line, index) => (
                        <tr key={`${line.sector}-${index}`}>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top font-bold text-center">
                                {index + 1}
                            </td>
                            <td className="border-l border-r border-foreground px-2 py-2 align-top">
                                <div className="space-y-1 text-[9px] leading-snug">
                                    <p className="font-black uppercase text-slate-900">
                                        Sector: {line.sector}
                                    </p>
                                    {multiLeg && tx.sector && (
                                        <p className="font-bold text-slate-600">
                                            Full route: {tx.sector}
                                        </p>
                                    )}
                                    <p className="font-bold text-slate-700">
                                        Flight date:{" "}
                                        {formatDisplayDate(
                                            legSource[index]?.travelDate ?? tx.travelDate
                                        )}
                                    </p>
                                    {index === 0 && (
                                        <div className="pt-0.5 border-t border-slate-100">
                                            {paxCount > 1 && (
                                                <p className="font-black uppercase text-slate-500">
                                                    No of Pax: {paxCount}
                                                </p>
                                            )}
                                            {compactPassengers ? (
                                                <p className="font-bold text-slate-800 uppercase">
                                                    {formatCompactPassengerDisplay(
                                                        passengers,
                                                        tx.passengerNames
                                                    )}
                                                </p>
                                            ) : (
                                                passengers.map((p, idx) => (
                                                    <p key={idx} className="font-bold text-slate-800">
                                                        {p.name}
                                                        {!multiLeg && (
                                                            <span className="text-slate-500 font-semibold">
                                                                {" "}
                                                                · Ticket No: {p.ticketNo || "N/A"}
                                                            </span>
                                                        )}
                                                    </p>
                                                ))
                                            )}
                                        </div>
                                    )}
                                    {multiLeg && (
                                        <p className="font-bold text-slate-700">
                                            Ticket No:{" "}
                                            {legSource[index]?.ticketNo?.trim() || "N/A"}
                                        </p>
                                    )}
                                </div>
                            </td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-center font-bold">
                                {paxCount}
                            </td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-center">
                                &nbsp;
                            </td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">
                                {formatNumber(line.taxableAmount)}
                            </td>
                            <td className="border-l border-r border-foreground px-2 py-3 align-top text-right font-bold">
                                {formatNumber(line.exemptAmount)}
                            </td>
                        </tr>
                    ))}

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
