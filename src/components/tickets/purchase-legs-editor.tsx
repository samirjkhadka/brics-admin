"use client";

import { useMemo } from "react";
import { Plus, X } from "lucide-react";
import PartnerCombobox, { PartnerOption } from "@/components/ui/partner-combobox";
import RouteBuilder from "@/components/ui/route-builder";
import NepaliDatePicker from "@/components/ui/nepali-date-picker";
import { joinSectors } from "@/lib/booking/helpers";
import { calculateTax } from "@/lib/utils/calculations";
import { formatNPR } from "@/lib/utils/format-currency";

export type PurchaseLegFormRow = {
    purchaseInvoiceNo: string;
    purchasePartyName: string;
    sector: string;
    purchaseDate: string;
    purchaseDateBS: string;
    travelDate: string;
    travelDateBS: string;
    purchaseAmount: string;
    lineSalesAmount: string;
    salesAmount: string;
    exemptAmount: string;
};

export const emptyLeg = (): PurchaseLegFormRow => ({
    purchaseInvoiceNo: "",
    purchasePartyName: "",
    sector: "",
    purchaseDate: "",
    purchaseDateBS: "",
    travelDate: "",
    travelDateBS: "",
    purchaseAmount: "",
    lineSalesAmount: "",
    salesAmount: "",
    exemptAmount: "0",
});

type PurchaseLegsEditorProps = {
    billingMode: "SINGLE" | "SPLIT";
    legs: PurchaseLegFormRow[];
    onChange: (legs: PurchaseLegFormRow[]) => void;
    supplierPartners: PartnerOption[];
    previewBillNos?: string[];
    maxLegs?: number;
    minLegs?: number;
};

export default function PurchaseLegsEditor({
    billingMode,
    legs,
    onChange,
    supplierPartners,
    previewBillNos = [],
    maxLegs = 8,
    minLegs = 1,
}: PurchaseLegsEditorProps) {
    const combinedSector = useMemo(() => joinSectors(legs), [legs]);

    const updateLeg = (index: number, patch: Partial<PurchaseLegFormRow>) => {
        const next = legs.map((leg, i) => (i === index ? { ...leg, ...patch } : leg));
        onChange(next);
    };

    const addLeg = () => {
        if (legs.length >= maxLegs) return;
        onChange([...legs, emptyLeg()]);
    };

    const removeLeg = (index: number) => {
        if (legs.length <= minLegs) return;
        onChange(legs.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {billingMode === "SINGLE" && legs.length > 1 && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    Combined route: <strong className="text-slate-800">{combinedSector}</strong>
                </p>
            )}

            {legs.length === 0 && (
                <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg px-3 py-3">
                    No purchase legs — this entry is sales only. Add a leg if you have supplier
                    purchase details.
                </p>
            )}

            {legs.map((leg, index) => (
                <div
                    key={index}
                    className="bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-4 space-y-3"
                >
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black uppercase tracking-wider text-slate-600">
                            {billingMode === "SPLIT" ? (
                                <>
                                    Purchase leg {index + 1}
                                    {previewBillNos[index] && (
                                        <span className="ml-2 font-mono text-brand-red">
                                            → Bill {previewBillNos[index]}
                                        </span>
                                    )}
                                </>
                            ) : (
                                `Purchase leg ${index + 1}`
                            )}
                        </p>
                        {legs.length > minLegs && (
                            <button
                                type="button"
                                onClick={() => removeLeg(index)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                title="Remove leg"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Purchase Invoice No *
                            </label>
                            <input
                                type="text"
                                required
                                value={leg.purchaseInvoiceNo}
                                onChange={(e) =>
                                    updateLeg(index, { purchaseInvoiceNo: e.target.value })
                                }
                                className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <PartnerCombobox
                            label="Purchased From (Supplier) *"
                            value={leg.purchasePartyName}
                            partners={supplierPartners}
                            onChange={(name) => updateLeg(index, { purchasePartyName: name })}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                            Sector (Route) *
                        </label>
                        <RouteBuilder
                            value={leg.sector}
                            required
                            onChange={(sector) => updateLeg(index, { sector })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <NepaliDatePicker
                            label="Purchase Date"
                            adValue={leg.purchaseDate}
                            bsValue={leg.purchaseDateBS}
                            onChange={(ad, bs) =>
                                updateLeg(index, { purchaseDate: ad, purchaseDateBS: bs })
                            }
                        />
                        <NepaliDatePicker
                            label="Travel Date"
                            adValue={leg.travelDate}
                            bsValue={leg.travelDateBS}
                            onChange={(ad, bs) =>
                                updateLeg(index, { travelDate: ad, travelDateBS: bs })
                            }
                        />
                    </div>

                    <div className="border-t border-slate-200 pt-3 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                            Leg financials
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Purchase Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={leg.purchaseAmount}
                                    onChange={(e) =>
                                        updateLeg(index, { purchaseAmount: e.target.value })
                                    }
                                    className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Sales Amount *
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    value={
                                        billingMode === "SINGLE"
                                            ? leg.lineSalesAmount
                                            : leg.salesAmount
                                    }
                                    onChange={(e) =>
                                        updateLeg(
                                            index,
                                            billingMode === "SINGLE"
                                                ? { lineSalesAmount: e.target.value }
                                                : { salesAmount: e.target.value }
                                        )
                                    }
                                    className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Exempt Amount
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={leg.exemptAmount}
                                    onChange={(e) =>
                                        updateLeg(index, { exemptAmount: e.target.value })
                                    }
                                    className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-emerald-600 mb-1">
                                    VAT (13%)
                                </label>
                                <div className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-emerald-700 font-bold text-sm">
                                    {formatNPR(
                                        calculateTax(
                                            parseFloat(
                                                billingMode === "SINGLE"
                                                    ? leg.lineSalesAmount
                                                    : leg.salesAmount
                                            ) || 0,
                                            parseFloat(leg.exemptAmount) || 0
                                        ).vatAmount
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Leg Profit
                                </label>
                                <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-bold text-sm">
                                    {formatNPR(
                                        (parseFloat(
                                            billingMode === "SINGLE"
                                                ? leg.lineSalesAmount
                                                : leg.salesAmount
                                        ) || 0) - (parseFloat(leg.purchaseAmount) || 0)
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {legs.length < maxLegs && (
                <button
                    type="button"
                    onClick={addLeg}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-brand-red hover:bg-brand-red/5 rounded-lg border border-dashed border-brand-red/30"
                >
                    <Plus size={14} /> Add purchase leg
                </button>
            )}
        </div>
    );
}
