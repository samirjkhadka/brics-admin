"use client";

import { useState } from "react";
import { RotateCcw, X, Check } from "lucide-react";
import { createRefund } from "@/app/actions/refunds";
import { useRouter } from "next/navigation";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { PaymentMethod, RefundType } from "@prisma/client";
import NepaliDatePicker from "@/components/ui/nepali-date-picker";

type RefundTransactionButtonProps = {
    id: string;
    salesBillNo: string;
    salesAmount: number;
    purchaseAmount: number;
    amountReceived: number;
    isVoided: boolean;
    refundStatus: string;
    priorCustomerRefund: number;
    priorSupplierCredit: number;
    priorCashRefund: number;
    showLabel?: boolean;
};

export function RefundTransactionButton({
    id,
    salesBillNo,
    salesAmount,
    purchaseAmount,
    amountReceived,
    isVoided,
    refundStatus,
    priorCustomerRefund,
    priorSupplierCredit,
    priorCashRefund,
    showLabel = false,
}: RefundTransactionButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const remainingSales = Math.max(0, salesAmount - priorCustomerRefund);
    const remainingPurchase = Math.max(0, purchaseAmount - priorSupplierCredit);
    const remainingCash = Math.max(0, amountReceived - priorCashRefund);

    const [form, setForm] = useState({
        refundType: RefundType.CUSTOMER_ONLY as RefundType,
        customerRefundAmount: remainingSales,
        supplierCreditAmount: remainingPurchase,
        supplierCreditNoteNo: "",
        refundDate: new Date().toISOString().slice(0, 10),
        paymentMethod: PaymentMethod.BANK as PaymentMethod,
        paymentReference: "",
        remarks: "",
    });

    if (isVoided || remainingSales <= 0) return null;

    const openModal = () => {
        setForm({
            refundType: RefundType.CUSTOMER_ONLY,
            customerRefundAmount: remainingSales,
            supplierCreditAmount: remainingPurchase,
            supplierCreditNoteNo: "",
            refundDate: new Date().toISOString().slice(0, 10),
            paymentMethod: PaymentMethod.BANK,
            paymentReference: "",
            remarks: "",
        });
        setError("");
        setOpen(true);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        const res = await createRefund(id, form);
        if (res.success) {
            setOpen(false);
            router.refresh();
        } else {
            setError(res.error || "Failed to create refund");
        }
        setLoading(false);
    };

    const showSupplierFields = form.refundType === RefundType.CUSTOMER_AND_SUPPLIER;
    const defaultCash = Math.min(form.customerRefundAmount, remainingCash);

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className={
                    showLabel
                        ? "flex items-center gap-2 bg-violet-50 hover:bg-violet-100 text-violet-700 px-6 py-2.5 rounded-xl border border-violet-200 font-bold transition-all"
                        : "p-1.5 bg-violet-50 rounded-lg text-violet-600 hover:bg-violet-500 hover:text-white transition-colors"
                }
                title={refundStatus === "FULL" ? "Add another refund" : "Refund Bill"}
            >
                <RotateCcw size={showLabel ? 18 : 14} />
                {showLabel && "Refund"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 my-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Refund Bill #{salesBillNo}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Remaining refundable: {remainingSales.toFixed(2)} (sales),{" "}
                                    {remainingCash.toFixed(2)} (cash received)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Refund type *
                            </label>
                            <select
                                value={form.refundType}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        refundType: e.target.value as RefundType,
                                    }))
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                            >
                                <option value={RefundType.CUSTOMER_ONLY}>
                                    Customer only (no supplier credit note)
                                </option>
                                <option value={RefundType.CUSTOMER_AND_SUPPLIER}>
                                    Customer + supplier credit note
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Customer credit / refund amount *
                            </label>
                            <input
                                type="number"
                                min={0.01}
                                max={remainingSales}
                                step="0.01"
                                value={form.customerRefundAmount}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        customerRefundAmount: parseFloat(e.target.value) || 0,
                                    }))
                                }
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                            />
                            {remainingCash > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                    Cash to customer (auto): {Math.min(form.customerRefundAmount, remainingCash).toFixed(2)}
                                </p>
                            )}
                        </div>

                        {showSupplierFields && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Supplier credit note no. *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.supplierCreditNoteNo}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, supplierCreditNoteNo: e.target.value }))
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                                        placeholder="e.g. CN-2083-042"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Supplier credit amount *
                                    </label>
                                    <input
                                        type="number"
                                        min={0.01}
                                        max={remainingPurchase}
                                        step="0.01"
                                        value={form.supplierCreditAmount}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                supplierCreditAmount: parseFloat(e.target.value) || 0,
                                            }))
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                                    />
                                </div>
                            </>
                        )}

                        <NepaliDatePicker
                            label="Refund date"
                            adValue={form.refundDate}
                            onChange={(ad) => setForm((f) => ({ ...f, refundDate: ad }))}
                            required
                        />

                        {defaultCash > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Payment method
                                    </label>
                                    <select
                                        value={form.paymentMethod}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                paymentMethod: e.target.value as PaymentMethod,
                                            }))
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                                    >
                                        {Object.values(PaymentMethod).map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                        Reference
                                    </label>
                                    <input
                                        type="text"
                                        value={form.paymentReference}
                                        onChange={(e) =>
                                            setForm((f) => ({ ...f, paymentReference: e.target.value }))
                                        }
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                                        placeholder="Cheque / txn ref"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Remarks
                            </label>
                            <textarea
                                value={form.remarks}
                                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                                rows={2}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3 justify-end">
                            <ButtonWithIcon
                                type="button"
                                icon={X}
                                onClick={() => setOpen(false)}
                                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                            >
                                Cancel
                            </ButtonWithIcon>
                            <ButtonWithIcon
                                type="button"
                                icon={Check}
                                onClick={handleSubmit}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-violet-600 text-white font-bold disabled:opacity-50"
                            >
                                {loading ? "Processing..." : "Confirm Refund"}
                            </ButtonWithIcon>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
