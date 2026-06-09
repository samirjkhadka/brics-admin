"use client";

import { useState, useMemo, useEffect } from "react";
import { PaymentMethod } from "@prisma/client";
import { createBooking, updateBooking, previewSalesBillNos } from "@/app/actions/bookings";
import { getCustomerTicketDefaults } from "@/app/actions/partners";
import { calculateTax } from "@/lib/utils/calculations";
import { adToBs, adStringToBs } from "@/lib/utils/nepali-calendar.client";
import { formatNPR } from "@/lib/utils/format-currency";
import { useRouter } from "next/navigation";
import { Plus, X, Check, Users } from "lucide-react";
import PartnerCombobox, { PartnerOption } from "@/components/ui/partner-combobox";
import NepaliDatePicker from "@/components/ui/nepali-date-picker";
import PurchaseLegsEditor, {
    emptyLeg,
    type PurchaseLegFormRow,
} from "@/components/tickets/purchase-legs-editor";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import { joinSectors } from "@/lib/booking/helpers";
import RouteBuilder from "@/components/ui/route-builder";

function buildInitialLegs(initialData?: Record<string, unknown>): PurchaseLegFormRow[] {
    const rawLegs = initialData?.purchaseLegs as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(rawLegs)) {
        if (!rawLegs.length) return [];
        return rawLegs.map((leg, index) => ({
            purchaseInvoiceNo: String(leg.purchaseInvoiceNo || ""),
            purchasePartyName: String(leg.purchasePartyName || ""),
            sector: String(leg.sector || ""),
            purchaseDate: leg.purchaseDate
                ? new Date(leg.purchaseDate as string).toISOString().split("T")[0]
                : "",
            purchaseDateBS: String(leg.purchaseDateBS || ""),
            travelDate: leg.travelDate
                ? new Date(leg.travelDate as string).toISOString().split("T")[0]
                : "",
            travelDateBS: String(leg.travelDateBS || ""),
            purchaseAmount: String(leg.purchaseAmount ?? ""),
            lineSalesAmount: String(leg.lineSalesAmount ?? ""),
            salesAmount: String(leg.lineSalesAmount ?? leg.salesAmount ?? ""),
            exemptAmount: String(
                leg.exemptAmount != null
                    ? leg.exemptAmount
                    : index === 0
                      ? (initialData?.exemptAmount ?? "0")
                      : "0"
            ),
            ticketNo: String(leg.ticketNo || ""),
        }));
    }
    return [emptyLeg()];
}

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
    const [billingMode, setBillingMode] = useState<"SINGLE" | "SPLIT">(
        (initialData?.billingMode as "SINGLE" | "SPLIT") || "SINGLE"
    );
    const [purchaseLegs, setPurchaseLegs] = useState<PurchaseLegFormRow[]>(() =>
        buildInitialLegs(initialData)
    );
    const [previewBillNos, setPreviewBillNos] = useState<string[]>([]);
    const [passengerCount, setPassengerCount] = useState(1);
    const [passengers, setPassengers] = useState<{ name: string; ticketNo: string }[]>([
        { name: "", ticketNo: "" },
    ]);

    const initSalesDate = initialData?.salesDate
        ? new Date(initialData.salesDate as string).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

    const [formData, setFormData] = useState({
        partyName: (initialData?.partyName as string) || "",
        salesBillNo: (initialData?.salesBillNo as string) || nextSalesBillNo || "",
        salesDate: initSalesDate,
        salesDateBS: (initialData?.salesDateBS as string) || "",
        salesAmount: initialData?.salesAmount?.toString() || "",
        exemptAmount: initialData?.exemptAmount?.toString() || "0",
        receivedStatus:
            (initialData?.paymentStatus as string) === "UNPAID" &&
            !(initialData?.amountReceived && Number(initialData.amountReceived) > 0)
                ? ""
                : (initialData?.receivedStatus as string) || "",
        amountReceived: initialData?.amountReceived?.toString() || "",
        receivedDate: initialData?.receivedDate
            ? new Date(initialData.receivedDate as string).toISOString().split("T")[0]
            : "",
        receiptNo: (initialData?.receiptNo as string) || "",
        chequeNo: (initialData?.chequeNo as string) || "",
        remarks: (initialData?.remarks as string) || "",
        partyVatNo: (initialData?.partyVatNo as string) || "",
        contactNo: (initialData?.contactNo as string) || "",
        hsCode: (initialData?.hsCode as string) || "",
        sector: (initialData?.sector as string) || "",
        travelDate: initialData?.travelDate
            ? new Date(initialData.travelDate as string).toISOString().split("T")[0]
            : "",
        travelDateBS: "",
    });

    const salesOnly = billingMode === "SINGLE" && purchaseLegs.length === 0;
    const useLegTicketNos =
        billingMode === "SPLIT" || (billingMode === "SINGLE" && purchaseLegs.length >= 2);

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

    useEffect(() => {
        if (billingMode !== "SPLIT" || isEdit) return;
        previewSalesBillNos(purchaseLegs.length).then((res) => {
            if (res.success) setPreviewBillNos(res.billNos);
        });
    }, [billingMode, purchaseLegs.length, isEdit]);

    const totalPurchase = useMemo(
        () => purchaseLegs.reduce((s, l) => s + (parseFloat(l.purchaseAmount) || 0), 0),
        [purchaseLegs]
    );

    const totalSales = useMemo(() => {
        if (salesOnly) return parseFloat(formData.salesAmount) || 0;
        return purchaseLegs.reduce(
            (s, l) =>
                s +
                (parseFloat(billingMode === "SINGLE" ? l.lineSalesAmount : l.salesAmount) || 0),
            0
        );
    }, [salesOnly, formData.salesAmount, billingMode, purchaseLegs]);

    const totalExempt = useMemo(() => {
        if (salesOnly) return parseFloat(formData.exemptAmount) || 0;
        return purchaseLegs.reduce((s, l) => s + (parseFloat(l.exemptAmount) || 0), 0);
    }, [salesOnly, formData.exemptAmount, purchaseLegs]);

    const resizePassengers = (count: number) => {
        const n = Math.max(1, count);
        setPassengerCount(n);
        setPassengers((prev) => {
            const next = [...prev];
            while (next.length < n) next.push({ name: "", ticketNo: "" });
            return next.slice(0, n);
        });
    };

    const { vatAmount: totalVat } = useMemo(
        () => calculateTax(totalSales, totalExempt),
        [totalSales, totalExempt]
    );

    const passengerPartyOptions = useMemo(
        () =>
            passengers
                .map((p, index) => ({
                    id: `passenger:${index}`,
                    name: p.name.trim(),
                }))
                .filter((p) => p.name),
        [passengers]
    );

    const passengerPartyNames = useMemo(
        () => new Set(passengerPartyOptions.map((p) => p.name)),
        [passengerPartyOptions]
    );

    const selectedSavedPartner = useMemo(
        () => customerPartners.find((p) => p.name === formData.partyName),
        [customerPartners, formData.partyName]
    );

    const isPassengerParty = passengerPartyNames.has(formData.partyName);

    const showAdditionalInfo = Boolean(selectedSavedPartner && !isPassengerParty);

    useEffect(() => {
        if (!selectedSavedPartner || isPassengerParty) return;

        let cancelled = false;
        getCustomerTicketDefaults(selectedSavedPartner.id).then((res) => {
            if (cancelled || !res.success || !res.data) return;
            setFormData((prev) => ({
                ...prev,
                partyVatNo: res.data!.partyVatNo || prev.partyVatNo,
                contactNo: res.data!.contactNo || prev.contactNo,
                hsCode: res.data!.hsCode || prev.hsCode,
            }));
        });

        return () => {
            cancelled = true;
        };
    }, [selectedSavedPartner?.id, isPassengerParty]);

    const incompleteParty = useMemo(() => {
        const customer = customerPartners.find((p) => p.name === formData.partyName);
        const incomplete: string[] = [];
        if (customer?.bankName === "Pending") incomplete.push(`Customer "${customer.name}"`);
        const suppliers = [...new Set(purchaseLegs.map((l) => l.purchasePartyName).filter(Boolean))];
        for (const name of suppliers) {
            const supplier = supplierPartners.find((p) => p.name === name);
            if (supplier?.bankName === "Pending") incomplete.push(`Supplier "${supplier.name}"`);
        }
        return incomplete;
    }, [customerPartners, supplierPartners, formData.partyName, purchaseLegs]);

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

        const passengerNames = JSON.stringify(passengers.filter((p) => p.name.trim() !== ""));

        const legsPayload = purchaseLegs.map((leg) => ({
            purchaseInvoiceNo: leg.purchaseInvoiceNo.trim(),
            purchasePartyName: leg.purchasePartyName.trim(),
            sector: leg.sector.trim(),
            purchaseDate: leg.purchaseDate || null,
            purchaseDateBS: leg.purchaseDate
                ? leg.purchaseDateBS || adStringToBs(leg.purchaseDate)
                : null,
            travelDate: leg.travelDate || null,
            travelDateBS: leg.travelDate
                ? leg.travelDateBS || adStringToBs(leg.travelDate)
                : null,
            purchaseAmount: parseFloat(leg.purchaseAmount) || 0,
            lineSalesAmount:
                billingMode === "SINGLE"
                    ? parseFloat(leg.lineSalesAmount) || 0
                    : leg.lineSalesAmount
                      ? parseFloat(leg.lineSalesAmount)
                      : undefined,
            salesAmount:
                billingMode === "SPLIT" ? parseFloat(leg.salesAmount) || 0 : undefined,
            exemptAmount: parseFloat(leg.exemptAmount) || 0,
            ticketNo: leg.ticketNo.trim() || null,
        }));

        const payload =
            billingMode === "SINGLE"
                ? {
                      billingMode: "SINGLE" as const,
                      passengerNames,
                      partyName: formData.partyName,
                      salesDate: formData.salesDate,
                      salesDateBS: formData.salesDateBS,
                      salesAmount: totalSales,
                      exemptAmount: totalExempt,
                      receivedStatus: formData.receivedStatus || undefined,
                      receivedDate: formData.receivedDate || null,
                      amountReceived: formData.amountReceived
                          ? parseFloat(formData.amountReceived)
                          : null,
                      receiptNo: formData.receiptNo || null,
                      chequeNo: formData.chequeNo || null,
                      remarks: formData.remarks || null,
                      partyVatNo: formData.partyVatNo || null,
                      contactNo: formData.contactNo || null,
                      hsCode: formData.hsCode || null,
                      purchaseLegs: legsPayload,
                      ...(legsPayload.length === 0
                          ? {
                                sector: formData.sector.trim(),
                                travelDate: formData.travelDate || null,
                                travelDateBS: formData.travelDate
                                    ? formData.travelDateBS || adStringToBs(formData.travelDate)
                                    : null,
                            }
                          : {}),
                  }
                : {
                      billingMode: "SPLIT" as const,
                      passengerNames,
                      partyName: formData.partyName,
                      salesDate: formData.salesDate,
                      salesDateBS: formData.salesDateBS,
                      receivedStatus: formData.receivedStatus || undefined,
                      receivedDate: formData.receivedDate || null,
                      amountReceived: formData.amountReceived
                          ? parseFloat(formData.amountReceived)
                          : null,
                      receiptNo: formData.receiptNo || null,
                      chequeNo: formData.chequeNo || null,
                      remarks: formData.remarks || null,
                      partyVatNo: formData.partyVatNo || null,
                      contactNo: formData.contactNo || null,
                      hsCode: formData.hsCode || null,
                      purchaseLegs: legsPayload,
                  };

        const res = initialData?.id
            ? await updateBooking(initialData.id as string, payload)
            : await createBooking(payload);

        if (res.success) {
            router.push("/dashboard/tickets");
            router.refresh();
        } else {
            setError(res.error || "Unknown error occurred");
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4">
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
                {!isEdit && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                            Customer Billing Mode
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(
                                [
                                    {
                                        id: "SINGLE" as const,
                                        title: "One sales bill",
                                        desc: "Multiple supplier purchases on a single customer invoice",
                                    },
                                    {
                                        id: "SPLIT" as const,
                                        title: "Separate sales bills",
                                        desc: "Multiple supplier invoices → one sales bill per leg with its own sector price",
                                    },
                                ] as const
                            ).map((mode) => (
                                <button
                                    key={mode.id}
                                    type="button"
                                    disabled={mode.id === "SPLIT" && purchaseLegs.length === 0}
                                    onClick={() => setBillingMode(mode.id)}
                                    className={`flex-1 min-w-[220px] text-left px-4 py-3 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                                        billingMode === mode.id
                                            ? "border-brand-red bg-brand-red/5 ring-1 ring-brand-red/20"
                                            : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <p className="text-sm font-black text-slate-900">{mode.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-1">{mode.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {isEdit && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-sm font-semibold">
                        Billing mode:{" "}
                        <strong>
                            {billingMode === "SINGLE"
                                ? "Single sales bill"
                                : "Separate sales bills (linked booking)"}
                        </strong>
                    </div>
                )}

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
                        <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1 flex items-center gap-1">
                                <Users size={12} /> No. of Passengers *
                            </label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={passengerCount}
                                onChange={(e) => resizePassengers(parseInt(e.target.value, 10) || 1)}
                                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                            />
                        </div>
                        <div className="space-y-4">
                            {passengers.map((p, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col gap-3 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200"
                                >
                                    <div className="w-full">
                                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                            Passenger {i + 1} Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="Full Name"
                                            value={p.name}
                                            onChange={(e) =>
                                                handlePassengerChange(i, "name", e.target.value)
                                            }
                                            className="w-full bg-white border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-3 items-end">
                                        {!useLegTicketNos && (
                                            <div className="flex-1">
                                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                                    Ticket No
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Ticket Number"
                                                    value={p.ticketNo}
                                                    onChange={(e) =>
                                                        handlePassengerChange(
                                                            i,
                                                            "ticketNo",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="w-full bg-white border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                                />
                                            </div>
                                        )}
                                        {passengers.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => resizePassengers(passengers.length - 1)}
                                                className="text-slate-400 hover:text-red-500 p-2 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {useLegTicketNos && i === 0 && (
                                        <p className="text-[10px] text-slate-500">
                                            Ticket numbers are entered on each purchase leg (different
                                            carriers per sector).
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <label className="block text-sm font-black text-slate-900 uppercase tracking-wider">
                        Billing & Trip
                    </label>
                        <PartnerCombobox
                            label="Party Name (Sell To)"
                            value={formData.partyName}
                            partners={customerPartners}
                            extraOptions={passengerPartyOptions}
                            onChange={(name, partner) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    partyName: name,
                                    partyVatNo: partner?.vatNo || "",
                                    contactNo: partner?.contactNo || "",
                                    hsCode: partner ? prev.hsCode : "",
                                }));
                            }}
                            required
                        />
                        {billingMode === "SINGLE" && (
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
                                    <p className="text-[10px] text-slate-400 mt-1">Auto-assigned bill number</p>
                                )}
                            </div>
                        )}
                        <NepaliDatePicker
                            label="Sales Date"
                            adValue={formData.salesDate}
                            bsValue={formData.salesDateBS}
                            required
                            onChange={(ad, bs) =>
                                setFormData((prev) => ({ ...prev, salesDate: ad, salesDateBS: bs }))
                            }
                        />
                        <div>
                            <label className="block text-sm font-black text-slate-900 uppercase tracking-wider mb-2">
                                Purchase legs
                                <span className="ml-2 text-[10px] font-bold text-slate-400 normal-case">
                                    (optional — remove all for sales-only)
                                </span>
                            </label>
                            <PurchaseLegsEditor
                                billingMode={billingMode}
                                legs={purchaseLegs}
                                onChange={setPurchaseLegs}
                                supplierPartners={supplierPartners}
                                previewBillNos={previewBillNos}
                                minLegs={0}
                                maxLegs={isEdit && billingMode === "SPLIT" ? 1 : 8}
                            />
                        </div>
                        {salesOnly && (
                            <div className="space-y-4 bg-amber-50/60 border border-amber-200/80 rounded-xl p-4">
                                <p className="text-xs font-bold text-amber-900">
                                    Sales only — no purchase legs. Enter trip and sales details below.
                                </p>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                        Sector (Route) *
                                    </label>
                                    <RouteBuilder
                                        value={formData.sector}
                                        required
                                        onChange={(sector) =>
                                            setFormData((prev) => ({ ...prev, sector }))
                                        }
                                    />
                                </div>
                                <NepaliDatePicker
                                    label="Travel Date"
                                    adValue={formData.travelDate}
                                    bsValue={formData.travelDateBS}
                                    onChange={(ad, bs) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            travelDate: ad,
                                            travelDateBS: bs,
                                        }))
                                    }
                                />
                            </div>
                        )}
                        {billingMode === "SINGLE" && purchaseLegs.length > 1 && (
                            <p className="text-xs text-slate-500">
                                Full route:{" "}
                                <span className="font-mono font-bold text-slate-700">
                                    {joinSectors(purchaseLegs)}
                                </span>
                            </p>
                        )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <label className="block text-sm font-black text-slate-900 uppercase tracking-wider">
                        Financials
                    </label>
                    <p className="text-xs text-slate-500">
                        {salesOnly
                            ? "Enter sales and exempt amounts below."
                            : "Enter purchase, sales, and exempt amounts on each purchase leg above. Totals below update automatically."}
                    </p>
                    {salesOnly && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Exempt Amount
                                </label>
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
                        </div>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                                Total Sales Amount
                            </p>
                            <p className="font-black text-slate-800">{formatNPR(totalSales)}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                                Total Exempt Amount
                            </p>
                            <p className="font-black text-slate-800">{formatNPR(totalExempt)}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-emerald-600">
                                Total VAT (13%)
                            </p>
                            <p className="font-black text-emerald-700">{formatNPR(totalVat)}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                                Total Purchase
                            </p>
                            <p className="font-black text-slate-800">{formatNPR(totalPurchase)}</p>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                            <p className="text-[10px] uppercase font-bold text-slate-400">
                                Total Sales
                            </p>
                            <p className="font-black text-slate-800">{formatNPR(totalSales)}</p>
                        </div>
                    </div>
                    <div className="bg-brand-red/5 border border-brand-red/10 p-4 rounded-xl">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 text-xs font-bold uppercase">
                                Estimated Net Profit
                            </span>
                            <span className="text-2xl font-black text-brand-red">
                                {formatNPR(totalSales - totalPurchase)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <label className="block text-sm font-black text-slate-900 uppercase tracking-wider">
                        Payment & Receipt
                    </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                    Payment via
                                </label>
                                <select
                                    name="receivedStatus"
                                    value={formData.receivedStatus}
                                    onChange={handleChange}
                                    className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                                >
                                    <option value="">— Not paid yet —</option>
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

                {showAdditionalInfo && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                        <label className="block text-sm font-black text-slate-900 uppercase tracking-wider">
                            Additional Information
                        </label>
                        <p className="text-xs text-slate-500">
                            From saved customer &ldquo;{selectedSavedPartner?.name}&rdquo;
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                    Party VAT No
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {formData.partyVatNo || "—"}
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                    Contact No
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {formData.contactNo || "—"}
                                </p>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                                    H.S. Code
                                </p>
                                <p className="text-sm font-semibold text-slate-800">
                                    {formData.hsCode || "—"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

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
