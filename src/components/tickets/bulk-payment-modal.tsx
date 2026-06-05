"use client";

import { useState, useMemo } from "react";
import { PaymentMethod } from "@prisma/client";
import { X, Check, Banknote } from "lucide-react";
import { bulkRecordPayment } from "@/app/actions/payments";
import { formatNPR } from "@/lib/utils/format-currency";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import { adToBs } from "@/lib/utils/nepali-calendar.client";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

type TxRow = {
    id: string;
    salesBillNo: string;
    partyName: string;
    passengerNames: string;
    salesAmount: number;
    amountReceived: number;
    paymentStatus: string;
};

export default function BulkPaymentModal({
    selected,
    onClose,
    onSuccess,
}: {
    selected: TxRow[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const today = new Date().toISOString().split("T")[0];

    const totalOutstanding = useMemo(
        () => selected.reduce((s, t) => s + t.salesAmount - t.amountReceived, 0),
        [selected]
    );

    const [form, setForm] = useState<{
        receivedStatus: PaymentMethod;
        receivedDate: string;
        amountReceived: string;
        chequeNo: string;
        issueReceipt: boolean;
    }>({
        receivedStatus: PaymentMethod.BANK,
        receivedDate: today,
        amountReceived: totalOutstanding.toFixed(2),
        chequeNo: "",
        issueReceipt: true,
    });

    const receivedDateBS = useMemo(() => {
        try {
            return form.receivedDate ? adToBs(new Date(form.receivedDate)) : "";
        } catch {
            return "";
        }
    }, [form.receivedDate]);

    const parties = new Set(selected.map((t) => t.partyName));
    const sameParty = parties.size === 1;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = await bulkRecordPayment({
            transactionIds: selected.map((t) => t.id),
            receivedStatus: form.receivedStatus,
            receivedDate: form.receivedDate,
            amountReceived: parseFloat(form.amountReceived),
            chequeNo: form.chequeNo || null,
            issueReceipt: form.issueReceipt,
        });

        if (res.success) {
            onSuccess();
            onClose();
        } else {
            setError(res.error || "Failed to record payment");
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Banknote className="text-brand-red" size={22} />
                        <h2 className="text-lg font-black text-slate-900">Record Payment</h2>
                        <span className="text-xs bg-brand-red/10 text-brand-red px-2 py-0.5 rounded-full font-bold">
                            {selected.length} ticket{selected.length !== 1 ? "s" : ""}
                        </span>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {!sameParty && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-semibold">
                            Selected tickets must belong to the same customer (party).
                        </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold uppercase text-slate-500 mb-2">Selected Tickets</p>
                        <ul className="space-y-1 text-sm">
                            {selected.map((tx) => (
                                <li key={tx.id} className="flex justify-between gap-2">
                                    <span>
                                        <span className="font-mono font-bold text-brand-red">#{tx.salesBillNo}</span>
                                        {" — "}
                                        {formatPassengerNames(tx.passengerNames)}
                                    </span>
                                    <span className="font-mono text-slate-600 shrink-0">
                                        {formatNPR(tx.salesAmount - tx.amountReceived)} due
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="text-sm font-black text-slate-900 mt-3 pt-3 border-t border-slate-200">
                            Total outstanding: {formatNPR(totalOutstanding)}
                        </p>
                        {sameParty && (
                            <p className="text-xs text-slate-500 mt-1">Party: {selected[0].partyName}</p>
                        )}
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Payment & Receipt</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Payment via *
                                </label>
                                <select
                                    value={form.receivedStatus}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, receivedStatus: e.target.value as PaymentMethod }))
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
                                    Receipt Date (AD) *
                                    <span className="text-purple-500 normal-case font-normal">{receivedDateBS} BS</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={form.receivedDate}
                                    onChange={(e) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Amount Received (NPR) *
                            </label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                max={totalOutstanding}
                                value={form.amountReceived}
                                onChange={(e) => setForm((f) => ({ ...f, amountReceived: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">
                                One receipt can cover multiple tickets when paid together.
                            </p>
                        </div>
                        {form.receivedStatus === PaymentMethod.CHEQUE && (
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
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.issueReceipt}
                                onChange={(e) => setForm((f) => ({ ...f, issueReceipt: e.target.checked }))}
                                className="rounded border-slate-300"
                            />
                            <span className="text-sm font-semibold text-slate-700">
                                Issue single receipt for combined payment
                            </span>
                        </label>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
                    )}

                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm"
                        >
                            Cancel
                        </button>
                        <ButtonWithIcon
                            type="submit"
                            icon={Check}
                            disabled={loading || !sameParty || totalOutstanding <= 0}
                            className="px-6 py-2.5 rounded-lg bg-brand-red text-white font-bold text-sm disabled:opacity-50"
                        >
                            {loading ? "Saving..." : form.issueReceipt ? "Mark Paid & Issue Receipt" : "Mark as Paid"}
                        </ButtonWithIcon>
                    </div>
                </form>
            </div>
        </div>
    );
}
