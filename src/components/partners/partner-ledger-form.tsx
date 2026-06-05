"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { updatePartnerOpeningBalance } from "@/app/actions/fiscal-year";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

export default function PartnerLedgerForm({
    partnerId,
    fiscalYearId,
    fyLabel,
    openingBalance,
}: {
    partnerId: string;
    fiscalYearId: string;
    fyLabel: string;
    openingBalance: number;
}) {
    const router = useRouter();
    const [value, setValue] = useState(String(openingBalance));
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState("");

    const handleSave = async () => {
        setLoading(true);
        const res = await updatePartnerOpeningBalance(partnerId, fiscalYearId, parseFloat(value) || 0);
        setMsg(res.success ? "Saved" : res.error || "Failed");
        setLoading(false);
        router.refresh();
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <p className="text-sm text-slate-500">Financial Year: <strong>{fyLabel}</strong></p>
            <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Opening Balance (NPR)</label>
                <input
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm"
                />
            </div>
            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            <ButtonWithIcon type="button" icon={Save} onClick={handleSave} disabled={loading} className="bg-brand-red text-white px-4 py-2 rounded-lg font-bold text-sm">
                Save Opening Balance
            </ButtonWithIcon>
        </div>
    );
}
