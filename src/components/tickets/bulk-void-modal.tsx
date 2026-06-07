"use client";

import { useState } from "react";
import { Ban, X, Check } from "lucide-react";
import { bulkVoidTransactions } from "@/app/actions/transactions";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

type TxRow = {
    id: string;
    salesBillNo: string;
    isVoided: boolean;
};

export default function BulkVoidModal({
    selected,
    onClose,
    onSuccess,
}: {
    selected: TxRow[];
    onClose: () => void;
    onSuccess: () => void;
}) {
    const voidable = selected.filter((tx) => !tx.isVoided);
    const [reason, setReason] = useState("");
    const [expandBookingGroups, setExpandBookingGroups] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleVoid = async () => {
        if (!reason.trim()) {
            setError("Void reason is required");
            return;
        }
        setLoading(true);
        setError("");
        const res = await bulkVoidTransactions({
            transactionIds: voidable.map((tx) => tx.id),
            reason: reason.trim(),
            expandBookingGroups,
        });
        if (res.success) {
            onSuccess();
        } else {
            setError(res.error || "Failed to void transactions");
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Ban size={20} className="text-amber-600" />
                            Void {voidable.length} Bill{voidable.length === 1 ? "" : "s"}
                        </h3>
                        <p className="text-sm text-slate-500 mt-1">
                            Marks selected bills as void. A reason is required for all.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="max-h-32 overflow-y-auto bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs font-mono text-slate-600 space-y-1">
                    {voidable.map((tx) => (
                        <div key={tx.id}>#{tx.salesBillNo}</div>
                    ))}
                </div>

                {selected.length > voidable.length && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        {selected.length - voidable.length} already voided — will be skipped.
                    </p>
                )}

                <label className="flex items-center gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        checked={expandBookingGroups}
                        onChange={(e) => setExpandBookingGroups(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    Include all linked bills in the same booking group
                </label>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                        Reason for void *
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                        placeholder="e.g. Duplicate entries, cancelled bookings..."
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
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                    >
                        Cancel
                    </ButtonWithIcon>
                    <ButtonWithIcon
                        type="button"
                        icon={Check}
                        onClick={handleVoid}
                        disabled={loading || voidable.length === 0}
                        className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold disabled:opacity-50"
                    >
                        {loading ? "Voiding..." : `Void ${voidable.length} Bill${voidable.length === 1 ? "" : "s"}`}
                    </ButtonWithIcon>
                </div>
            </div>
        </div>
    );
}
