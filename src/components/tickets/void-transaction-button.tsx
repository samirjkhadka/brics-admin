"use client";

import { useState } from "react";
import { Ban, X, Check } from "lucide-react";
import { voidTransaction } from "@/app/actions/transactions";
import { useRouter } from "next/navigation";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

export function VoidTransactionButton({
    id,
    salesBillNo,
    isVoided,
}: {
    id: string;
    salesBillNo: string;
    isVoided: boolean;
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (isVoided) return null;

    const handleVoid = async () => {
        if (!reason.trim()) {
            setError("Void reason is required");
            return;
        }
        setLoading(true);
        setError("");
        const res = await voidTransaction(id, { reason: reason.trim() });
        if (res.success) {
            setOpen(false);
            setReason("");
            router.refresh();
        } else {
            setError(res.error || "Failed to void transaction");
        }
        setLoading(false);
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="p-1.5 bg-amber-50 rounded-lg text-amber-600 hover:bg-amber-500 hover:text-white transition-colors"
                title="Void Bill"
            >
                <Ban size={14} />
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Void Bill #{salesBillNo}</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    This marks the bill as void. A reason is required.
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
                                Reason for void *
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                                placeholder="e.g. Duplicate entry, cancelled booking..."
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
                                onClick={handleVoid}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-amber-600 text-white font-bold disabled:opacity-50"
                            >
                                {loading ? "Voiding..." : "Confirm Void"}
                            </ButtonWithIcon>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
