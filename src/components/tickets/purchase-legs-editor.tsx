"use client";

import { useMemo, useState } from "react";
import { Plus, X, Split } from "lucide-react";
import PartnerCombobox, { PartnerOption } from "@/components/ui/partner-combobox";
import RouteBuilder from "@/components/ui/route-builder";
import NepaliDatePicker from "@/components/ui/nepali-date-picker";
import { allocateLineSalesAmounts, joinSectors } from "@/lib/booking/helpers";
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
    ticketNo: string;
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
    ticketNo: "",
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
    const [splitTotalSales, setSplitTotalSales] = useState("");
    const [splitError, setSplitError] = useState("");

    const totalPurchase = useMemo(
        () => legs.reduce((s, l) => s + (parseFloat(l.purchaseAmount) || 0), 0),
        [legs]
    );

    const showSplitSales = legs.length >= 2;
    const showLegTicketNo = legs.length >= 2 || billingMode === "SPLIT";

    const splitSalesAcrossLegs = () => {
        const total = parseFloat(splitTotalSales);
        if (!total || total <= 0) {
            setSplitError("Enter a total sales amount greater than zero.");
            return;
        }

        const purchaseAmounts = legs.map((l) => parseFloat(l.purchaseAmount) || 0);
        if (purchaseAmounts.every((p) => p <= 0)) {
            setSplitError("Enter purchase amounts on each leg before splitting.");
            return;
        }

        const amounts = allocateLineSalesAmounts(
            purchaseAmounts.map((purchaseAmount) => ({ purchaseAmount })),
            total
        );

        const next = legs.map((leg, i) => ({
            ...leg,
            ...(billingMode === "SINGLE"
                ? { lineSalesAmount: amounts[i].toFixed(2) }
                : { salesAmount: amounts[i].toFixed(2) }),
        }));

        onChange(next);
        setSplitError("");
    };

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

            {showSplitSales && (
                <div className="bg-violet-50/80 border border-violet-200 rounded-xl p-4 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-black uppercase tracking-wider text-violet-900">
                                Split total sales across legs
                            </p>
                            <p className="text-[11px] text-violet-700 mt-1 max-w-xl">
                                {billingMode === "SPLIT"
                                    ? "Distributes the total customer price across separate sales bills by each leg’s purchase amount."
                                    : "Distributes one combined sales total across legs on a single bill by purchase amount."}
                            </p>
                        </div>
                        <p className="text-[11px] text-violet-600 font-semibold">
                            Total purchase: {formatNPR(totalPurchase)}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[180px] max-w-xs">
                            <label className="block text-[10px] uppercase font-bold text-violet-700 mb-1">
                                Total sales (NPR)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={splitTotalSales}
                                onChange={(e) => {
                                    setSplitTotalSales(e.target.value);
                                    setSplitError("");
                                }}
                                placeholder="e.g. 294000"
                                className="w-full bg-white border border-violet-200 rounded-lg px-3 py-2 text-sm font-mono"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={splitSalesAcrossLegs}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-colors"
                        >
                            <Split size={14} />
                            Split by purchase ratio
                        </button>
                    </div>
                    {splitError && (
                        <p className="text-xs text-red-600 font-semibold">{splitError}</p>
                    )}
                    {totalPurchase > 0 && splitTotalSales && parseFloat(splitTotalSales) > 0 && (
                        <p className="text-[10px] text-violet-600">
                            Preview:{" "}
                            {legs
                                .map((leg, i) => {
                                    const purchase = parseFloat(leg.purchaseAmount) || 0;
                                    const share = ((purchase / totalPurchase) * 100).toFixed(1);
                                    return `Leg ${i + 1} ${share}%`;
                                })
                                .join(" · ")}
                        </p>
                    )}
                </div>
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

                    {showLegTicketNo && (
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Ticket No
                            </label>
                            <input
                                type="text"
                                value={leg.ticketNo}
                                onChange={(e) => updateLeg(index, { ticketNo: e.target.value })}
                                placeholder="e.g. SUM99999"
                                className="w-full bg-white border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
                            />
                            {legs.length >= 2 && (
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Each sector may use a different carrier ticket number.
                                </p>
                            )}
                        </div>
                    )}

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
