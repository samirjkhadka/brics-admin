"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Lock, RefreshCw, Settings2 } from "lucide-react";
import { closeFinancialYear, ensureFiscalYearBootstrap, updateFiscalYearBillSettings } from "@/app/actions/fiscal-year";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import {
    BILL_FORMAT_PRESETS,
    RECEIPT_FORMAT_PRESETS,
    previewBillFormat,
} from "@/lib/fiscal-year/bill-format";

type FY = {
    id: string;
    label: string;
    startDateBS: string;
    endDateBS: string;
    startDateAD: string;
    endDateAD: string;
    billPrefixYear: number;
    nextBillSeq: number;
    nextReceiptSeq: number;
    billNoFormat: string;
    receiptNoFormat: string;
    status: string;
};

export default function FiscalYearClient({
    active,
    allYears,
}: {
    active: FY | null;
    allYears: FY[];
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const [billFormat, setBillFormat] = useState(active?.billNoFormat || "{year}-{seq:3}");
    const [receiptFormat, setReceiptFormat] = useState(active?.receiptNoFormat || "R-{year}-{seq:3}");
    const [nextBillSeq, setNextBillSeq] = useState(active?.nextBillSeq ?? 1);
    const [nextReceiptSeq, setNextReceiptSeq] = useState(active?.nextReceiptSeq ?? 1);

    const billPreview = useMemo(() => {
        if (!active) return "";
        return previewBillFormat(billFormat, active.billPrefixYear, nextBillSeq);
    }, [active, billFormat, nextBillSeq]);

    const receiptPreview = useMemo(() => {
        if (!active) return "";
        return previewBillFormat(receiptFormat, active.billPrefixYear, nextReceiptSeq);
    }, [active, receiptFormat, nextReceiptSeq]);

    const handleBootstrap = async () => {
        setLoading(true);
        const res = await ensureFiscalYearBootstrap();
        setMessage(res.success ? "Financial year initialized" : res.error || "Failed");
        setLoading(false);
        router.refresh();
    };

    const handleClose = async () => {
        if (!confirm("Close the active financial year? This will snapshot balances and open the next FY with bill 001.")) return;
        setLoading(true);
        const res = await closeFinancialYear();
        if (res.success) {
            setMessage(`Closed ${res.data?.closed}. Opened ${res.data?.opened}.`);
        } else {
            setMessage(res.error || "Failed to close FY");
        }
        setLoading(false);
        router.refresh();
    };

    const handleSaveBillSettings = async () => {
        if (!active) return;
        setLoading(true);
        setMessage("");
        const res = await updateFiscalYearBillSettings({
            fiscalYearId: active.id,
            billNoFormat: billFormat,
            receiptNoFormat: receiptFormat,
            nextBillSeq,
            nextReceiptSeq,
        });
        if (res.success) {
            setMessage(`Bill settings saved. Next bill: ${res.data?.nextBillPreview}`);
            router.refresh();
        } else {
            setMessage(res.error || "Failed to save settings");
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {!active && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="text-sm text-amber-800 mb-3">No active financial year. Initialize to enable FY bill numbering.</p>
                    <ButtonWithIcon type="button" icon={RefreshCw} onClick={handleBootstrap} disabled={loading} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm">
                        Initialize FY
                    </ButtonWithIcon>
                </div>
            )}

            {active && (
                <>
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="text-brand-red" size={20} />
                            <h2 className="text-lg font-black">Active: {active.label}</h2>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">OPEN</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500 text-xs font-bold uppercase">Period (BS)</span>
                                <p className="font-semibold">{active.startDateBS} → {active.endDateBS}</p>
                            </div>
                            <div>
                                <span className="text-slate-500 text-xs font-bold uppercase">Period (AD)</span>
                                <p className="font-semibold">
                                    {new Date(active.startDateAD).toLocaleDateString()} → {new Date(active.endDateAD).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <ButtonWithIcon
                            type="button"
                            icon={Lock}
                            onClick={handleClose}
                            disabled={loading}
                            className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm"
                        >
                            Close Financial Year (EOFY)
                        </ButtonWithIcon>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                        <div className="flex items-center gap-2">
                            <Settings2 className="text-brand-red" size={20} />
                            <h2 className="text-lg font-black">Bill & Receipt Numbering</h2>
                        </div>
                        <p className="text-sm text-slate-500">
                            Use <code className="bg-slate-100 px-1 rounded text-xs">{"{year}"}</code> for BS bill prefix year (
                            {active.billPrefixYear}) and <code className="bg-slate-100 px-1 rounded text-xs">{"{seq:3}"}</code> for
                            zero-padded sequence (3 = pad to 001).
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bill format</label>
                                <select
                                    value={BILL_FORMAT_PRESETS.find((p) => p.value === billFormat)?.value || "custom"}
                                    onChange={(e) => {
                                        if (e.target.value !== "custom") setBillFormat(e.target.value);
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
                                >
                                    {BILL_FORMAT_PRESETS.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                    <option value="custom">Custom…</option>
                                </select>
                                <input
                                    type="text"
                                    value={billFormat}
                                    onChange={(e) => setBillFormat(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                    placeholder="{year}-{seq:3}"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Receipt format</label>
                                <select
                                    value={RECEIPT_FORMAT_PRESETS.find((p) => p.value === receiptFormat)?.value || "custom"}
                                    onChange={(e) => {
                                        if (e.target.value !== "custom") setReceiptFormat(e.target.value);
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-2"
                                >
                                    {RECEIPT_FORMAT_PRESETS.map((p) => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                    <option value="custom">Custom…</option>
                                </select>
                                <input
                                    type="text"
                                    value={receiptFormat}
                                    onChange={(e) => setReceiptFormat(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                    placeholder="R-{year}-{seq:3}"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next bill sequence</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={nextBillSeq}
                                    onChange={(e) => setNextBillSeq(parseInt(e.target.value, 10) || 1)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">Set to 1 to start from 001 this FY</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Next receipt sequence</label>
                                <input
                                    type="number"
                                    min={1}
                                    value={nextReceiptSeq}
                                    onChange={(e) => setNextReceiptSeq(parseInt(e.target.value, 10) || 1)}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Next bill preview</span>
                                <p className="font-mono font-black text-brand-red text-lg">{billPreview || "—"}</p>
                            </div>
                            <div>
                                <span className="text-[10px] font-bold uppercase text-slate-500">Next receipt preview</span>
                                <p className="font-mono font-bold text-slate-800 text-lg">{receiptPreview || "—"}</p>
                            </div>
                        </div>

                        <ButtonWithIcon
                            type="button"
                            icon={Settings2}
                            onClick={handleSaveBillSettings}
                            disabled={loading}
                            className="bg-brand-red text-white px-6 py-2 rounded-lg font-bold text-sm"
                        >
                            Save Bill Settings
                        </ButtonWithIcon>
                    </div>
                </>
            )}

            {message && <p className="text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg">{message}</p>}

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <th className="px-4 py-3 text-left">Label</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Bill format</th>
                            <th className="px-4 py-3 text-left">BS Period</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {allYears.map((fy) => (
                            <tr key={fy.id}>
                                <td className="px-4 py-3 font-semibold">{fy.label}</td>
                                <td className="px-4 py-3">{fy.status}</td>
                                <td className="px-4 py-3 font-mono text-xs text-slate-600">{fy.billNoFormat || "{year}-{seq:3}"}</td>
                                <td className="px-4 py-3 text-slate-600">{fy.startDateBS} – {fy.endDateBS}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
