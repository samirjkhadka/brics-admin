"use client";

import { useState, useMemo, useEffect } from "react";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { calculateTax, adToBs, bsToAd } from "@/lib/utils/calculations";
import { formatNPR } from "@/lib/utils/format-currency";
import { useRouter } from "next/navigation";
import { Plus, X, Calendar } from "lucide-react";

export default function TicketEntryForm({ initialData }: { initialData?: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [passengers, setPassengers] = useState<any[]>([{ name: "", ticketNo: "" }]);

    const [formData, setFormData] = useState({
        partyName: initialData?.partyName || "",
        sector: initialData?.sector || "",
        salesBillNo: initialData?.salesBillNo || "",
        salesDate: initialData?.salesDate ? new Date(initialData.salesDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        purchaseInvoiceNo: initialData?.purchaseInvoiceNo || "",
        purchaseDate: initialData?.purchaseDate ? new Date(initialData.purchaseDate).toISOString().split("T")[0] : "",
        purchaseAmount: initialData?.purchaseAmount?.toString() || "",
        salesAmount: initialData?.salesAmount?.toString() || "",
        exemptAmount: initialData?.exemptAmount?.toString() || "0",
        receivedStatus: initialData?.receivedStatus || "BANK",
        receivedDate: initialData?.receivedDate ? new Date(initialData.receivedDate).toISOString().split("T")[0] : "",
        receiptNo: initialData?.receiptNo || "",
        remarks: initialData?.remarks || "",
        travelDate: initialData?.travelDate ? new Date(initialData.travelDate).toISOString().split("T")[0] : "",
        partyVatNo: initialData?.partyVatNo || "",
        contactNo: initialData?.contactNo || "",
        hsCode: initialData?.hsCode || "",
    });

    useEffect(() => {
        if (initialData?.passengerNames) {
            try {
                const parsed = JSON.parse(initialData.passengerNames);
                if (Array.isArray(parsed)) {
                    setPassengers(parsed);
                } else {
                    setPassengers([{ name: initialData.passengerNames, ticketNo: "" }]);
                }
            } catch {
                setPassengers([{ name: initialData.passengerNames, ticketNo: "" }]);
            }
        }
    }, [initialData]);

    const { taxableAmount, vatAmount } = useMemo(() => {
        return calculateTax(
            parseFloat(formData.salesAmount) || 0,
            parseFloat(formData.exemptAmount) || 0
        );
    }, [formData.salesAmount, formData.exemptAmount]);

    const travelDateBS = useMemo(() => {
        if (!formData.travelDate) return "";
        try {
            return adToBs(new Date(formData.travelDate));
        } catch (e) {
            return "";
        }
    }, [formData.travelDate]);

    const salesDateBS = useMemo(() => {
        if (!formData.salesDate) return "";
        try {
            return adToBs(new Date(formData.salesDate));
        } catch (e) {
            return "";
        }
    }, [formData.salesDate]);

    const purchaseDateBS = useMemo(() => {
        if (!formData.purchaseDate) return "";
        try {
            return adToBs(new Date(formData.purchaseDate));
        } catch (e) {
            return "";
        }
    }, [formData.purchaseDate]);

    const receivedDateBS = useMemo(() => {
        if (!formData.receivedDate) return "";
        try {
            return adToBs(new Date(formData.receivedDate));
        } catch (e) {
            return "";
        }
    }, [formData.receivedDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const addPassenger = () => setPassengers([...passengers, { name: "", ticketNo: "" }]);
    const removePassenger = (index: number) => {
        if (passengers.length > 1) {
            setPassengers(passengers.filter((_, i) => i !== index));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (parseFloat(formData.salesAmount) < parseFloat(formData.exemptAmount)) {
            setError("Exempt amount cannot be greater than sales amount");
            setLoading(false);
            return;
        }

        const payload = {
            ...formData,
            salesDateBS: salesDateBS,
            purchaseDateBS: purchaseDateBS,
            passengerNames: JSON.stringify(passengers.filter(p => p.name.trim() !== ""))
        };

        const res = initialData?.id
            ? await updateTransaction(initialData.id, payload)
            : await createTransaction(payload);

        if (res.success) {
            router.push("/dashboard/tickets");
            router.refresh();
        } else {
            setError(res.error || "Unknown error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 px-4">
            <div className="flex justify-between items-center mb-6 pt-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {initialData?.id ? "Edit Transaction" : "Advanced Ticket Entry"}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. Passenger(s) Section */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-wider">Passenger Details</label>
                        <button
                            type="button"
                            onClick={addPassenger}
                            className="text-xs bg-brand-red/10 text-brand-red px-3 py-1.5 rounded-lg hover:bg-brand-red/20 transition-colors flex items-center gap-2"
                        >
                            <Plus size={14} /> Add Passenger
                        </button>
                    </div>
                    <div className="space-y-4">
                        {passengers.map((p, i) => (
                            <div key={i} className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Passenger {i + 1} Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        value={p.name}
                                        onChange={(e) => handlePassengerChange(i, "name", e.target.value)}
                                        className="w-full bg-white border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                    />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Ticket No</label>
                                    <input
                                        type="text"
                                        placeholder="Ticket Number"
                                        value={p.ticketNo}
                                        onChange={(e) => handlePassengerChange(i, "ticketNo", e.target.value)}
                                        className="w-full bg-white border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                    />
                                </div>
                                {passengers.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removePassenger(i)}
                                        className="text-slate-400 hover:text-red-500 p-2 bg-white rounded-lg border border-slate-200 shadow-sm"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 2. Core Bill Info */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Billing & Trip</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Party Name *</label>
                                <input type="text" name="partyName" required value={formData.partyName} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sector (Route) *</label>
                                <input type="text" name="sector" required placeholder="KTM-DXB" value={formData.sector} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sales Bill No *</label>
                                <input type="text" name="salesBillNo" required value={formData.salesBillNo} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex justify-between">
                                    Sales Date (AD) *
                                    <span className="text-brand-red italic lowercase font-normal">{salesDateBS} (BS)</span>
                                </label>
                                <input type="date" name="salesDate" required value={formData.salesDate} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Purchase Invoice No *</label>
                                <input type="text" name="purchaseInvoiceNo" required value={formData.purchaseInvoiceNo} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex justify-between">
                                    Purchase Date (AD)
                                    <span className="text-amber-500 italic lowercase font-normal">{purchaseDateBS} (BS)</span>
                                </label>
                                <input type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex justify-between">
                                Travel Date (AD) *
                                <span className="text-emerald-500 italic lowercase font-normal">{travelDateBS} (BS)</span>
                            </label>
                            <input type="date" name="travelDate" required value={formData.travelDate} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                        </div>
                    </div>

                    {/* 3. Financials */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Financials</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Purchase Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="purchaseAmount"
                                    required
                                    value={formData.purchaseAmount}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Sales Amount *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="salesAmount"
                                    required
                                    value={formData.salesAmount}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Exempt Amount (VAT Free)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    name="exemptAmount"
                                    value={formData.exemptAmount}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 text-emerald-500">VAT (13%)</label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-emerald-600 font-bold text-sm">
                                    {formatNPR(vatAmount)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-xs font-bold uppercase">Estimated Net Profit</span>
                                <span className="text-2xl font-black text-slate-900">
                                    {formatNPR(parseFloat(formData.salesAmount) - parseFloat(formData.purchaseAmount) || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 4. Payment & Receipt */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Payment & Receipt</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Payment via *</label>
                                <select name="receivedStatus" value={formData.receivedStatus} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all">
                                    <option value="BANK">BANK</option>
                                    <option value="CASH">CASH</option>
                                    <option value="QR">QR</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex justify-between">
                                    Receipt Date (AD)
                                    <span className="text-purple-500 italic lowercase font-normal">{receivedDateBS} (BS)</span>
                                </label>
                                <input type="date" name="receivedDate" value={formData.receivedDate} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Receipt No</label>
                            <input type="text" name="receiptNo" value={formData.receiptNo} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Remarks</label>
                            <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={2} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" placeholder="Any additional notes..."></textarea>
                        </div>
                    </div>

                    {/* 5. Additional Compliance */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">Additional Information</label>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Party VAT No</label>
                                <input type="text" name="partyVatNo" value={formData.partyVatNo} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Contact No</label>
                                <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">H.S. Code</label>
                                <input type="text" name="hsCode" value={formData.hsCode} onChange={handleChange} className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                {error && <div className="text-red-500 text-sm font-medium bg-red-500/10 p-4 rounded-lg border border-red-500/20">{error}</div>}

                <div className="flex justify-end gap-4">
                    <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors bg-white border border-slate-200 font-semibold shadow-sm">Cancel</button>
                    <button type="submit" disabled={loading} className="px-10 py-3 rounded-lg bg-brand-red hover:bg-brand-red-dark text-white font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-brand-red/20">
                        {loading ? "Processing..." : initialData?.id ? "Update Transaction" : "Finalize Transaction"}
                    </button>
                </div>
            </form>
        </div>
    );
}
