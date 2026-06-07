"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PaymentMethod } from "@prisma/client";
import { Banknote, X } from "lucide-react";
import { formatNPR } from "@/lib/utils/format-currency";
import { recordSupplierPayment } from "@/app/actions/supplier-payments";
import { adToBs } from "@/lib/utils/nepali-calendar.client";
import type { SupplierStatementRow } from "@/lib/ledger/party-ledger";

type SupplierRow = SupplierStatementRow;

export default function SupplierStatementTable({
    rows,
    fiscalYearId,
    canEdit = false,
}: {
    rows: SupplierRow[];
    fiscalYearId: string;
    canEdit?: boolean;
}) {
    const router = useRouter();
    const [paymentTarget, setPaymentTarget] = useState<SupplierRow | null>(null);

    return (
        <>
            <table className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden text-sm">
                <thead>
                    <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                        <th className="px-4 py-3 text-left">Supplier</th>
                        <th className="px-4 py-3 text-right">Bills</th>
                        <th className="px-4 py-3 text-right">Gross Purchase</th>
                        <th className="px-4 py-3 text-right">Credit Notes</th>
                        <th className="px-4 py-3 text-right">Net Purchase</th>
                        <th className="px-4 py-3 text-right">Payment Made</th>
                        <th className="px-4 py-3 text-right">Balance Due</th>
                        {canEdit && <th className="px-4 py-3 text-center">Action</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {rows.map((s) => (
                        <tr key={s.supplierName} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-semibold">{s.supplierName}</td>
                            <td className="px-4 py-3 text-right">
                                <Link
                                    href={`/dashboard/tickets?purchaseFrom=${encodeURIComponent(s.supplierName)}`}
                                    className="font-bold text-brand-red hover:underline"
                                    title="View bills in All Transactions"
                                >
                                    {s.count}
                                </Link>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">{formatNPR(s.purchase)}</td>
                            <td className="px-4 py-3 text-right font-mono text-violet-600">
                                {s.creditNotes > 0 ? formatNPR(s.creditNotes) : "—"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold">
                                {formatNPR(s.netPurchase)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-emerald-700">
                                {s.paymentsMade > 0 ? formatNPR(s.paymentsMade) : "—"}
                            </td>
                            <td
                                className={`px-4 py-3 text-right font-mono font-bold ${
                                    s.balanceDue > 0
                                        ? "text-amber-700"
                                        : s.balanceDue < 0
                                          ? "text-violet-700"
                                          : "text-slate-600"
                                }`}
                            >
                                {formatNPR(s.balanceDue)}
                            </td>
                            {canEdit && (
                                <td className="px-4 py-3 text-center">
                                    {s.balanceDue > 0.01 ? (
                                        <button
                                            type="button"
                                            onClick={() => setPaymentTarget(s)}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-red/10 text-brand-red text-xs font-bold hover:bg-brand-red/20 transition-colors"
                                        >
                                            <Banknote size={14} />
                                            Pay
                                        </button>
                                    ) : (
                                        <span className="text-xs text-slate-400">—</span>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {paymentTarget && (
                <SupplierPaymentModal
                    supplier={paymentTarget}
                    fiscalYearId={fiscalYearId}
                    onClose={() => setPaymentTarget(null)}
                    onSuccess={() => {
                        setPaymentTarget(null);
                        router.refresh();
                    }}
                />
            )}
        </>
    );
}

function SupplierPaymentModal({
    supplier,
    fiscalYearId,
    onClose,
    onSuccess,
}: {
    supplier: SupplierRow;
    fiscalYearId: string;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const today = new Date().toISOString().split("T")[0];
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState<{
        paymentMethod: PaymentMethod;
        paymentDate: string;
        amount: string;
        chequeNo: string;
        paymentReference: string;
        remarks: string;
    }>({
        paymentMethod: PaymentMethod.BANK,
        paymentDate: today,
        amount: supplier.balanceDue.toFixed(2),
        chequeNo: "",
        paymentReference: "",
        remarks: "",
    });

    const paymentDateBS = (() => {
        try {
            return form.paymentDate ? adToBs(new Date(form.paymentDate)) : "";
        } catch {
            return "";
        }
    })();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await recordSupplierPayment({
            fiscalYearId,
            supplierName: supplier.supplierName,
            amount: parseFloat(form.amount),
            paymentMethod: form.paymentMethod,
            paymentDate: form.paymentDate,
            chequeNo: form.chequeNo || null,
            paymentReference: form.paymentReference || null,
            remarks: form.remarks || null,
        });

        if (res.success) {
            onSuccess();
        } else {
            setError(res.error || "Failed to record payment");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">Make Supplier Payment</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{supplier.supplierName}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500 font-semibold">Net purchase</span>
                            <span className="font-mono font-bold">{formatNPR(supplier.netPurchase)}</span>
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-slate-500 font-semibold">Already paid</span>
                            <span className="font-mono">{formatNPR(supplier.paymentsMade)}</span>
                        </div>
                        <div className="flex justify-between mt-2 pt-2 border-t border-slate-200">
                            <span className="text-slate-700 font-bold">Balance due</span>
                            <span className="font-mono font-black text-amber-700">
                                {formatNPR(supplier.balanceDue)}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Payment via *
                            </label>
                            <select
                                value={form.paymentMethod}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        paymentMethod: e.target.value as PaymentMethod,
                                    }))
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="BANK">BANK</option>
                                <option value="CASH">CASH</option>
                                <option value="QR">QR</option>
                                <option value="CHEQUE">CHEQUE</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex justify-between">
                                Payment Date (AD)
                                <span className="text-purple-500 italic lowercase font-normal">
                                    {paymentDateBS} (BS)
                                </span>
                            </label>
                            <input
                                type="date"
                                required
                                value={form.paymentDate}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, paymentDate: e.target.value }))
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Amount (NPR) *
                        </label>
                        <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            max={supplier.balanceDue}
                            value={form.amount}
                            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                        />
                    </div>

                    {form.paymentMethod === PaymentMethod.CHEQUE && (
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Cheque No *
                            </label>
                            <input
                                type="text"
                                required
                                value={form.chequeNo}
                                onChange={(e) => setForm((f) => ({ ...f, chequeNo: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Payment Reference
                        </label>
                        <input
                            type="text"
                            value={form.paymentReference}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, paymentReference: e.target.value }))
                            }
                            placeholder="Bank transfer ref, voucher no., etc."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 font-semibold bg-red-50 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-brand-red text-white font-bold text-sm hover:bg-brand-red-dark disabled:opacity-50"
                        >
                            {loading ? "Saving…" : "Record Payment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
