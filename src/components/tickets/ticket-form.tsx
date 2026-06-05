"use client";

import { useState, useMemo, useEffect } from "react";
import { PaymentMethod } from "@prisma/client";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { calculateTax } from "@/lib/utils/calculations";
import { adToBs, adStringToBs } from "@/lib/utils/nepali-calendar.client";
import { formatNPR } from "@/lib/utils/format-currency";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Users } from "lucide-react";
import PartnerCombobox, { PartnerOption } from "@/components/ui/partner-combobox";
import NepaliDatePicker from "@/components/ui/nepali-date-picker";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

type TicketEntryFormProps = {
    initialData?: Record<string, unknown>;
    customerPartners?: PartnerOption[];
    supplierPartners?: PartnerOption[];
    nextSalesBillNo?: string;
};

export default function TicketEntryForm({
    initialData,
    customerPartners = [],
    supplierPartners = [],
    nextSalesBillNo = "",
}: TicketEntryFormProps) {
    const isEdit = Boolean(initialData?.id);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [passengerCount, setPassengerCount] = useState(1);
    const [passengers, setPassengers] = useState<{ name: string; ticketNo: string }[]>([
        { name: "", ticketNo: "" },
    ]);

    const initSalesDate = initialData?.salesDate
        ? new Date(initialData.salesDate as string).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

    const [formData, setFormData] = useState({
        partyName: (initialData?.partyName as string) || "",
        purchasePartyName: (initialData?.purchasePartyName as string) || "",
        sector: (initialData?.sector as string) || "",
        salesBillNo: (initialData?.salesBillNo as string) || nextSalesBillNo || "",
        salesDate: initSalesDate,
        salesDateBS: (initialData?.salesDateBS as string) || "",
        purchaseInvoiceNo: (initialData?.purchaseInvoiceNo as string) || "",
        purchaseDate: initialData?.purchaseDate
            ? new Date(initialData.purchaseDate as string).toISOString().split("T")[0]
            : "",
        purchaseDateBS: (initialData?.purchaseDateBS as string) || "",
        purchaseAmount: initialData?.purchaseAmount?.toString() || "",
        salesAmount: initialData?.salesAmount?.toString() || "",
        exemptAmount: initialData?.exemptAmount?.toString() || "0",
        receivedStatus: (initialData?.receivedStatus as string) || PaymentMethod.BANK,
        amountReceived: initialData?.amountReceived?.toString() || "",
        receivedDate: initialData?.receivedDate
            ? new Date(initialData.receivedDate as string).toISOString().split("T")[0]
            : "",
        receiptNo: (initialData?.receiptNo as string) || "",
        chequeNo: (initialData?.chequeNo as string) || "",
        remarks: (initialData?.remarks as string) || "",
        travelDate: initialData?.travelDate
            ? new Date(initialData.travelDate as string).toISOString().split("T")[0]
            : "",
        partyVatNo: (initialData?.partyVatNo as string) || "",
        contactNo: (initialData?.contactNo as string) || "",
        hsCode: (initialData?.hsCode as string) || "",
    });

    useEffect(() => {
        if (!formData.salesDateBS && formData.salesDate) {
            try {
                const bs = adStringToBs(formData.salesDate);
                if (bs) {
                    setFormData((prev) => ({ ...prev, salesDateBS: bs }));
                }
            } catch {
                // NepaliFunctions not loaded yet; server should provide salesDateBS
            }
        }
    }, [formData.salesDate, formData.salesDateBS]);

    useEffect(() => {
        if (initialData?.passengerNames) {
            try {
                const parsed = JSON.parse(initialData.passengerNames as string);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setPassengers(parsed);
                    setPassengerCount(parsed.length);
                }
            } catch {
                setPassengers([{ name: initialData.passengerNames as string, ticketNo: "" }]);
                setPassengerCount(1);
            }
        }
    }, [initialData]);

    const resizePassengers = (count: number) => {
        const n = Math.max(1, Math.min(20, count));
        setPassengerCount(n);
        setPassengers((prev) => {
            const next = [...prev];
            while (next.length < n) next.push({ name: "", ticketNo: "" });
            return next.slice(0, n);
        });
    };

    const { vatAmount } = useMemo(() => {
        return calculateTax(
            parseFloat(formData.salesAmount) || 0,
            parseFloat(formData.exemptAmount) || 0
        );
    }, [formData.salesAmount, formData.exemptAmount]);

    const incompleteParty = useMemo(() => {
        const customer = customerPartners.find((p) => p.name === formData.partyName);
        const supplier = supplierPartners.find((p) => p.name === formData.purchasePartyName);
        const incomplete: string[] = [];
        if (customer?.bankName === "Pending") incomplete.push(`Customer "${customer.name}"`);
        if (supplier?.bankName === "Pending") incomplete.push(`Supplier "${supplier.name}"`);
        return incomplete;
    }, [customerPartners, supplierPartners, formData.partyName, formData.purchasePartyName]);

    const receivedDateBS = useMemo(() => {
        if (!formData.receivedDate) return "";
        try {
            return adToBs(new Date(formData.receivedDate));
        } catch {
            return "";
        }
    }, [formData.receivedDate]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handlePassengerChange = (index: number, field: string, value: string) => {
        const newPassengers = [...passengers];
        newPassengers[index] = { ...newPassengers[index], [field]: value };
        setPassengers(newPassengers);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = {
            ...formData,
            purchaseDateBS: formData.purchaseDate ? formData.purchaseDateBS || adStringToBs(formData.purchaseDate) : null,
            passengerNames: JSON.stringify(passengers.filter((p) => p.name.trim() !== "")),
        };

        const res = initialData?.id
            ? await updateTransaction(initialData.id as string, payload)
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
            {incompleteParty.length > 0 && (
                <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm font-semibold">
                    Incomplete partner record: {incompleteParty.join(", ")} — update bank details in Partners before EOFY.
                </div>
            )}

            <div className="flex justify-between items-center mb-6 pt-8">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                    {initialData?.id ? "Edit Transaction" : "Advanced Ticket Entry"}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-black text-slate-900 uppercase tracking-wider">
                            Passenger Details
                        </label>
                        <ButtonWithIcon
                            type="button"
                            icon={Plus}
                            onClick={() => resizePassengers(passengerCount + 1)}
                            className="text-xs bg-brand-red/10 text-brand-red px-3 py-1.5 rounded-lg hover:bg-brand-red/20 transition-colors"
                        >
                            Add Passenger
                        </ButtonWithIcon>
                    </div>
                    <div className="space-y-4">
                        {passengers.map((p, i) => (
                            <div
                                key={i}
                                className="flex flex-col md:flex-row gap-4 items-end bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200"
                            >
                                <div className="flex-1 w-full">
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                        Passenger {i + 1} Name *
                                    </label>
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
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                        Ticket No
                                    </label>
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
                                        onClick={() => resizePassengers(passengers.length - 1)}
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
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                            Billing & Trip
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <PartnerCombobox
                                label="Party Name (Sell To)"
                                value={formData.partyName}
                                partners={customerPartners}
                                onChange={(name, partner) => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        partyName: name,
                                        partyVatNo: partner?.vatNo || prev.partyVatNo,
                                        contactNo: partner?.contactNo || prev.contactNo,
                                    }));
                                }}
                                required
                            />
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                                    <Users size={12} /> No. of Passengers *
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    required
                                    value={passengerCount}
                                    onChange={(e) => resizePassengers(parseInt(e.target.value, 10) || 1)}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Sector (Route) *
                            </label>
                            <input
                                type="text"
                                name="sector"
                                required
                                placeholder="KTM-DXB"
                                value={formData.sector}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Sales Bill No *
                            </label>
                            <input
                                type="text"
                                name="salesBillNo"
                                required
                                readOnly={!isEdit}
                                value={formData.salesBillNo}
                                onChange={handleChange}
                                className={`w-full border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all ${
                                    isEdit ? "bg-slate-50" : "bg-slate-100 font-mono font-bold cursor-default"
                                }`}
                            />
                            {!isEdit && (
                                <p className="text-[10px] text-slate-400 mt-1">Auto-assigned for each new bill</p>
                            )}
                        </div>
                        <NepaliDatePicker
                            label="Sales Date"
                            adValue={formData.salesDate}
                            required
                            onChange={(ad, bs) =>
                                setFormData((prev) => ({ ...prev, salesDate: ad, salesDateBS: bs }))
                            }
                        />
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Purchase Invoice No *
                            </label>
                            <input
                                type="text"
                                name="purchaseInvoiceNo"
                                required
                                value={formData.purchaseInvoiceNo}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                            />
                        </div>
                        <NepaliDatePicker
                            label="Purchase Date"
                            adValue={formData.purchaseDate}
                            onChange={(ad, bs) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    purchaseDate: ad,
                                    purchaseDateBS: bs,
                                }))
                            }
                        />
                        <NepaliDatePicker
                            label="Travel Date"
                            adValue={formData.travelDate}
                            required
                            onChange={(ad) => setFormData((prev) => ({ ...prev, travelDate: ad }))}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4 flex flex-col">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                            Financials
                        </label>
                        <PartnerCombobox
                            label="Purchased From (Buy From)"
                            value={formData.purchasePartyName}
                            partners={supplierPartners}
                            onChange={(name) =>
                                setFormData((prev) => ({ ...prev, purchasePartyName: name }))
                            }
                            required
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Purchase Amount *
                                </label>
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
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Sales Amount *
                                </label>
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
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Exempt Amount (VAT Free)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="exemptAmount"
                                    value={formData.exemptAmount}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 text-emerald-500">
                                    VAT (13%)
                                </label>
                                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-emerald-600 font-bold text-sm">
                                    {formatNPR(vatAmount)}
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-xs font-bold uppercase">
                                    Estimated Net Profit
                                </span>
                                <span className="text-2xl font-black text-slate-900">
                                    {formatNPR(
                                        parseFloat(formData.salesAmount) -
                                            parseFloat(formData.purchaseAmount) || 0
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                            Payment & Receipt
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Payment via *
                                </label>
                                <select
                                    name="receivedStatus"
                                    value={formData.receivedStatus}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                >
                                    <option value="BANK">BANK</option>
                                    <option value="CASH">CASH</option>
                                    <option value="QR">QR</option>
                                    <option value="CHEQUE">CHEQUE</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex justify-between">
                                    Receipt Date (AD)
                                    <span className="text-purple-500 italic lowercase font-normal">
                                        {receivedDateBS} (BS)
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    name="receivedDate"
                                    value={formData.receivedDate}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Amount Received (NPR)
                            </label>
                            <input
                                type="number"
                                name="amountReceived"
                                min="0"
                                step="0.01"
                                value={formData.amountReceived}
                                onChange={handleChange}
                                placeholder="Leave blank if unpaid"
                                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                            />
                        </div>
                        {formData.receivedStatus === PaymentMethod.CHEQUE && (
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Cheque No *
                                </label>
                                <input
                                    type="text"
                                    name="chequeNo"
                                    required
                                    value={formData.chequeNo}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Receipt No
                            </label>
                            <input
                                type="text"
                                name="receiptNo"
                                value={formData.receiptNo}
                                onChange={handleChange}
                                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                Remarks
                            </label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                rows={2}
                                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                placeholder="Any additional notes..."
                            />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                            Additional Information
                        </label>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Party VAT No
                                </label>
                                <input
                                    type="text"
                                    name="partyVatNo"
                                    value={formData.partyVatNo}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Contact No
                                </label>
                                <input
                                    type="text"
                                    name="contactNo"
                                    value={formData.contactNo}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    H.S. Code
                                </label>
                                <input
                                    type="text"
                                    name="hsCode"
                                    value={formData.hsCode}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="text-red-500 text-sm font-medium bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-4">
                    <ButtonWithIcon
                        type="button"
                        icon={X}
                        onClick={() => router.back()}
                        className="px-6 py-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors bg-white border border-slate-200 font-semibold shadow-sm"
                    >
                        Cancel
                    </ButtonWithIcon>
                    <ButtonWithIcon
                        type="submit"
                        icon={Check}
                        disabled={loading}
                        className="px-10 py-3 rounded-lg bg-brand-red hover:bg-brand-red-dark text-white font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-brand-red/20"
                    >
                        {loading
                            ? "Processing..."
                            : initialData?.id
                              ? "Update Transaction"
                              : "Finalize Transaction"}
                    </ButtonWithIcon>
                </div>
            </form>
        </div>
    );
}
