import db from "@/lib/db";
import { notFound } from "next/navigation";
import { Download, ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { formatNPR } from "@/lib/utils/format-currency";
import { formatDisplayDate } from "@/lib/utils/format-display-date";
import {
    formatPurchasedFromLabel,
    isOwnSalesBill,
    isPurchasePartyUnset,
} from "@/lib/utils/purchase-party";
import { displayPaymentMethod } from "@/lib/utils/payment-status";
import { parsePassengers } from "@/lib/utils/parse-passengers";
import { TransactionActions } from "@/components/tickets/transaction-actions";
import { IssueReceiptButton } from "@/components/tickets/issue-receipt-button";
import { RefundTransactionButton } from "@/components/tickets/refund-transaction-button";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";
import { sumRefundTotals } from "@/lib/refunds/helpers";
import { getLinkedTransactions } from "@/lib/booking/group";
import LinkedBookingsCard from "@/components/tickets/linked-bookings-card";

export default async function TransactionDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [tx, receipt, session, linkedBookings] = await Promise.all([
        db.transaction.findUnique({
            where: { id },
            include: {
                refunds: { orderBy: { refundDateAD: "desc" } },
                purchaseLegs: { orderBy: { legIndex: "asc" } },
            },
        }),
        db.paymentReceipt.findFirst({ where: { transactionId: id } }),
        getSession(),
        getLinkedTransactions(id),
    ]);

    if (!tx) notFound();

    const canEdit = session?.user?.role === Role.SUPERADMIN || session?.user?.role === Role.ADMIN;
    const refundTotals = sumRefundTotals(tx.refunds);
    const salesAmount = Number(tx.salesAmount);
    const purchaseAmount = Number(tx.purchaseAmount);
    const amountReceived = Number(tx.amountReceived);

    const passengers = parsePassengers(tx.passengerNames);

    const purchaseSource = {
        purchasePartyName: tx.purchasePartyName,
        purchaseInvoiceNo: tx.purchaseInvoiceNo,
        purchaseAmount: Number(tx.purchaseAmount),
    };
    const ownSales = isOwnSalesBill(purchaseSource);
    const supplierMissing = !ownSales && isPurchasePartyUnset(tx.purchasePartyName);
    const purchasedFromLabel = formatPurchasedFromLabel(purchaseSource);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {supplierMissing && (
                <div className="bg-orange-50 border border-orange-200 text-orange-900 px-4 py-3 rounded-xl text-sm font-semibold flex flex-wrap items-center justify-between gap-2">
                    <span>
                        Purchasing partner not updated
                        {tx.purchasePartyName ? ` (currently: ${tx.purchasePartyName})` : ""}.
                    </span>
                    {canEdit && (
                        <Link
                            href={`/dashboard/tickets/${tx.id}/edit`}
                            className="text-orange-800 font-bold hover:underline text-xs uppercase"
                        >
                            Update ticket
                        </Link>
                    )}
                </div>
            )}
            <LinkedBookingsCard currentId={tx.id} transactions={linkedBookings} />

            {tx.purchaseLegs.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <p className="text-sm font-black text-slate-900">Purchase legs</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Supplier invoices linked to this customer bill
                        </p>
                    </div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">Purchase Invoice</th>
                                <th className="px-6 py-3">Supplier</th>
                                <th className="px-6 py-3">Sector</th>
                                <th className="px-6 py-3">Ticket No</th>
                                <th className="px-6 py-3 text-right">Purchase</th>
                                <th className="px-6 py-3 text-right">Line Sales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {tx.purchaseLegs.map((leg) => (
                                <tr key={leg.id}>
                                    <td className="px-6 py-3 font-mono text-slate-500">{leg.legIndex}</td>
                                    <td className="px-6 py-3 font-mono">{leg.purchaseInvoiceNo}</td>
                                    <td className="px-6 py-3">{leg.purchasePartyName}</td>
                                    <td className="px-6 py-3 font-medium">{leg.sector}</td>
                                    <td className="px-6 py-3 font-mono text-slate-600">
                                        {leg.ticketNo || "—"}
                                    </td>
                                    <td className="px-6 py-3 text-right">{formatNPR(leg.purchaseAmount)}</td>
                                    <td className="px-6 py-3 text-right font-semibold">
                                        {formatNPR(leg.lineSalesAmount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="flex justify-between items-center">
                <Link
                    href="/dashboard/tickets"
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Registry
                </Link>
                <div className="flex flex-wrap gap-3 justify-end">
                    {canEdit && <TransactionActions id={tx.id} salesBillNo={tx.salesBillNo} />}
                    {canEdit && !tx.isVoided && (
                        <IssueReceiptButton
                            transactionId={tx.id}
                            hasReceipt={!!receipt}
                            receiptNo={receipt?.receiptNo || tx.receiptNo}
                        />
                    )}
                    {canEdit && (
                        <RefundTransactionButton
                            id={tx.id}
                            salesBillNo={tx.salesBillNo}
                            salesAmount={salesAmount}
                            purchaseAmount={purchaseAmount}
                            amountReceived={amountReceived}
                            isVoided={tx.isVoided}
                            refundStatus={tx.refundStatus}
                            priorCustomerRefund={refundTotals.customerRefund}
                            priorSupplierCredit={refundTotals.supplierCredit}
                            priorCashRefund={refundTotals.customerCash}
                            showLabel
                        />
                    )}
                    <Link
                        href={`/dashboard/tickets/${tx.id}/bill`}
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl border border-slate-200 font-bold transition-all shadow-sm"
                    >
                        <Printer size={18} />
                        Proforma Bill
                    </Link>
                    <Link
                        href={`/dashboard/tickets/${tx.id}/tax-invoice`}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                    >
                        <Printer size={18} />
                        Tax Invoice
                    </Link>
                    {receipt && (
                        <Link
                            href={`/dashboard/tickets/${tx.id}/receipt`}
                            className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-6 py-2.5 rounded-xl border border-emerald-200 font-bold transition-all"
                        >
                            <Printer size={18} />
                            Receipt
                        </Link>
                    )}
                    <a
                        href={`/api/export/pdf/${tx.id}`}
                        className="flex items-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2.5 rounded-xl font-black transition-all shadow-lg shadow-brand-red/20 active:scale-95"
                    >
                        <Download size={18} />
                        Download DOCX
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
                            <p className="text-sm text-slate-600 font-medium">Purchased From: <span className="text-slate-900">{purchasedFromLabel}</span></p>
                        </div>
                    </div>
                    <div className="text-right space-y-4">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Details</p>
                            <p className="text-lg font-black text-slate-900">#{tx.salesBillNo}</p>
                            <p className="text-sm text-slate-600 font-medium mt-1">Date (BS): <span className="text-slate-900">{tx.salesDateBS}</span></p>
                            <p className="text-sm text-slate-600 font-medium">Date (AD): <span className="text-slate-900">{formatDisplayDate(tx.salesDate)}</span></p>
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
                            {(tx.purchaseLegs.length > 0
                                ? tx.purchaseLegs
                                : [
                                      {
                                          id: "fallback",
                                          sector: tx.sector,
                                          lineSalesAmount: tx.salesAmount,
                                      },
                                  ]
                            ).map((leg, index) => {
                                const multiLeg = tx.purchaseLegs.length > 1;
                                const legTicketNo =
                                    "ticketNo" in leg && leg.ticketNo
                                        ? String(leg.ticketNo)
                                        : null;

                                return (
                                <tr key={leg.id}>
                                    <td className="px-6 py-8">
                                        {index === 0 ? (
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="font-black text-slate-900 uppercase">Air Ticket</p>
                                                    <p className="text-xs text-slate-400 font-medium mt-1 italic">
                                                        Travel Date:{" "}
                                                        {formatDisplayDate(tx.travelDate, "N/A")}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    {passengers.map((p, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-slate-50/50 p-3 rounded-xl border border-slate-100"
                                                        >
                                                            <p className="font-black text-slate-800 text-sm">
                                                                {p.name}
                                                            </p>
                                                            {!multiLeg && (
                                                                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                                                                    Ticket: {p.ticketNo || "N/A"}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">Additional sector</span>
                                        )}
                                        {multiLeg && (
                                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-3">
                                                Ticket: {legTicketNo || "N/A"}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-8 text-center font-bold text-slate-700">
                                        {leg.sector}
                                    </td>
                                    <td className="px-6 py-8 text-right font-black text-slate-900">
                                        {formatNPR(leg.lineSalesAmount)}
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {tx.refunds.length > 0 && (
                    <div className="mb-8 bg-violet-50 p-6 rounded-2xl border border-violet-100">
                        <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-3">
                            Refunds ({tx.refundStatus})
                        </p>
                        <div className="space-y-3">
                            {tx.refunds.map((r) => (
                                <div
                                    key={r.id}
                                    className="bg-white rounded-xl border border-violet-100 p-4 text-sm grid grid-cols-2 md:grid-cols-4 gap-3"
                                >
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Date</span>
                                        <p className="font-semibold">{r.refundDateBS}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Type</span>
                                        <p className="font-semibold">{r.refundType.replace(/_/g, " ")}</p>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Customer</span>
                                        <p className="font-semibold">{formatNPR(r.customerRefundAmount)}</p>
                                        {Number(r.customerCashAmount) > 0 && (
                                            <p className="text-xs text-slate-500">
                                                Cash: {formatNPR(r.customerCashAmount)}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Supplier CN</span>
                                        <p className="font-semibold">
                                            {r.supplierCreditNoteNo || "—"}
                                        </p>
                                        {Number(r.supplierCreditAmount) > 0 && (
                                            <p className="text-xs text-slate-500">
                                                {formatNPR(r.supplierCreditAmount)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Payment & Receipt</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Payment Via</span>
                            <p className="text-slate-900 font-semibold">
                                {displayPaymentMethod(tx.receivedStatus, tx.paymentStatus) || "—"}
                            </p>
                        </div>
                        {tx.chequeNo && (
                            <div>
                                <span className="text-slate-500 font-bold text-[10px] uppercase">Cheque No</span>
                                <p className="text-slate-900 font-semibold">{tx.chequeNo}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Receipt Date</span>
                            <p className="text-slate-900 font-semibold">{formatDisplayDate(tx.receivedDate, "N/A")}</p>
                        </div>
                        <div>
                            <span className="text-slate-500 font-bold text-[10px] uppercase">Receipt No</span>
                            <p className="text-slate-900 font-semibold">{tx.receiptNo || "N/A"}</p>
                        </div>
                    </div>
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
