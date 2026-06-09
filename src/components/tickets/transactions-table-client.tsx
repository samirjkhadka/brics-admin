"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    FileCheck,
    Filter,
    Pencil,
    Trash2,
    Banknote,
    Ban,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import BulkPaymentModal from "@/components/tickets/bulk-payment-modal";
import BulkVoidModal from "@/components/tickets/bulk-void-modal";
import Link from "next/link";
import { formatNumber } from "@/lib/utils/format-currency";
import { formatDisplayDate } from "@/lib/utils/format-display-date";
import { isOwnSalesBill, isPurchasePartyUnset } from "@/lib/utils/purchase-party";
import { displayPaymentMethod } from "@/lib/utils/payment-status";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import { deleteTransaction, bulkDeleteTransactions } from "@/app/actions/transactions";
import { VoidTransactionButton } from "@/components/tickets/void-transaction-button";
import { RefundTransactionButton } from "@/components/tickets/refund-transaction-button";
import { useRouter } from "next/navigation";

interface Transaction {
    id: string;
    passengerNames: string;
    partyName: string;
    purchasePartyName: string;
    sector: string;
    billSequence: number | null;
    salesBillNo: string;
    salesDate: string;
    salesDateBS: string;
    purchaseInvoiceNo: string;
    purchaseDate: string | null;
    purchaseDateBS: string | null;
    purchaseAmount: number;
    salesAmount: number;
    exemptAmount: number;
    taxableAmount: number;
    vatAmount: number;
    receivedStatus: string;
    receivedDate: string | null;
    receiptNo: string | null;
    remarks: string | null;
    travelDate: string | null;
    travelDateBS: string | null;
    isVoided: boolean;
    voidReason: string | null;
    refundStatus: string;
    paymentStatus: string;
    amountReceived: number;
    priorCustomerRefund: number;
    priorSupplierCredit: number;
    priorCashRefund: number;
    billingMode?: string;
    bookingGroupId?: string | null;
}

type DateFieldFilter = "sales" | "travel";

type SortKey =
    | "billSequence"
    | "salesDate"
    | "travelDate"
    | "purchaseDate"
    | "passengerNames"
    | "partyName"
    | "salesBillNo"
    | "purchaseInvoiceNo"
    | "sector"
    | "purchaseAmount"
    | "salesAmount"
    | "exemptAmount"
    | "taxableAmount"
    | "vatAmount"
    | "netProfit";

type SortDir = "asc" | "desc";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100] as const;

function compareSortValue(a: string | number | null, b: string | number | null, dir: SortDir): number {
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    let cmp = 0;
    if (typeof a === "string" && typeof b === "string") {
        cmp = a.localeCompare(b, undefined, { sensitivity: "base" });
    } else {
        cmp = Number(a) - Number(b);
    }
    return dir === "asc" ? cmp : -cmp;
}

function compareTransactions(a: Transaction, b: Transaction, key: SortKey, dir: SortDir): number {
    switch (key) {
        case "billSequence": {
            const seq = compareSortValue(a.billSequence, b.billSequence, dir);
            if (seq !== 0) return seq;
            return compareSortValue(a.salesBillNo, b.salesBillNo, dir);
        }
        case "salesDate":
            return compareSortValue(new Date(a.salesDate).getTime(), new Date(b.salesDate).getTime(), dir);
        case "travelDate":
            return compareSortValue(
                a.travelDate ? new Date(a.travelDate).getTime() : null,
                b.travelDate ? new Date(b.travelDate).getTime() : null,
                dir
            );
        case "purchaseDate":
            return compareSortValue(
                a.purchaseDate ? new Date(a.purchaseDate).getTime() : null,
                b.purchaseDate ? new Date(b.purchaseDate).getTime() : null,
                dir
            );
        case "netProfit":
            return compareSortValue(a.salesAmount - a.purchaseAmount, b.salesAmount - b.purchaseAmount, dir);
        default:
            return compareSortValue(a[key], b[key], dir);
    }
}

function getFilterDate(tx: Transaction, dateField: DateFieldFilter): Date | null {
    const raw = dateField === "sales" ? tx.salesDate : tx.travelDate;
    if (!raw) return null;
    return new Date(raw);
}

function matchesDateFilter(
    tx: Transaction,
    filterType: "MONTH" | "YEAR" | "CUSTOM",
    dateField: DateFieldFilter,
    options: {
        selectedMonth: string;
        selectedYear: string;
        startDate: string;
        endDate: string;
    }
): boolean {
    const txDate = getFilterDate(tx, dateField);
    if (!txDate) return false;

    if (filterType === "MONTH") {
        return (
            txDate.getMonth().toString() === options.selectedMonth &&
            txDate.getFullYear().toString() === options.selectedYear
        );
    }

    if (filterType === "YEAR") {
        return txDate.getFullYear().toString() === options.selectedYear;
    }

    const start = options.startDate ? new Date(options.startDate) : new Date(0);
    const end = options.endDate ? new Date(options.endDate) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return txDate >= start && txDate <= end;
}

function matchesBillNoRange(billNo: string, from: string, to: string): boolean {
    const normalized = billNo.trim().toLowerCase();
    const fromNorm = from.trim().toLowerCase();
    const toNorm = to.trim().toLowerCase();
    if (!fromNorm && !toNorm) return true;
    if (fromNorm && toNorm) return normalized >= fromNorm && normalized <= toNorm;
    if (fromNorm) return normalized >= fromNorm;
    return normalized <= toNorm;
}

function SortableHeader({
    label,
    sortKeyName,
    activeKey,
    activeDir,
    onSort,
    align = "left",
}: {
    label: string;
    sortKeyName: SortKey;
    activeKey: SortKey;
    activeDir: SortDir;
    onSort: (key: SortKey) => void;
    align?: "left" | "right" | "center";
}) {
    const active = activeKey === sortKeyName;
    const Icon = active ? (activeDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
    const alignClass =
        align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start";

    return (
        <th className={`px-4 py-4 whitespace-nowrap ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}`}>
            <button
                type="button"
                onClick={() => onSort(sortKeyName)}
                className={`inline-flex items-center gap-1 hover:text-slate-800 transition-colors ${alignClass} w-full`}
            >
                {label}
                <Icon size={12} className={active ? "text-brand-red" : "text-slate-300"} />
            </button>
        </th>
    );
}

export default function TransactionsTableClient({
    initialData,
    canEdit = true,
    initialSectorFilter = "",
    initialPurchaseFromFilter = "",
    initialPartyFilter = "",
    initialTravelDate = "",
    initialSearchTerm = "",
}: {
    initialData: Transaction[];
    canEdit?: boolean;
    initialSectorFilter?: string;
    initialPurchaseFromFilter?: string;
    initialPartyFilter?: string;
    initialTravelDate?: string;
    initialSearchTerm?: string;
}) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
    const [sectorFilter, setSectorFilter] = useState(initialSectorFilter);
    const [purchaseFromFilter, setPurchaseFromFilter] = useState(initialPurchaseFromFilter);
    const [partyFilter, setPartyFilter] = useState(initialPartyFilter);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [bulkActionLoading, setBulkActionLoading] = useState(false);
    const [expandBookingGroups, setExpandBookingGroups] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState<"ALL" | "MONTH" | "YEAR" | "CUSTOM">(
        initialTravelDate ? "CUSTOM" : "ALL"
    );
    const [dateFieldFilter, setDateFieldFilter] = useState<DateFieldFilter>(
        initialTravelDate ? "travel" : "sales"
    );
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [startDate, setStartDate] = useState(initialTravelDate);
    const [endDate, setEndDate] = useState(initialTravelDate);
    const [billNoFrom, setBillNoFrom] = useState("");
    const [billNoTo, setBillNoTo] = useState("");
    const [paymentFilter, setPaymentFilter] = useState<"ALL" | "UNPAID" | "PARTIAL" | "PAID">("ALL");
    const [sortKey, setSortKey] = useState<SortKey>("billSequence");
    const [sortDir, setSortDir] = useState<SortDir>("desc");
    const [itemsPerPage, setItemsPerPage] = useState(15);

    const handleDelete = async (id: string, salesBillNo: string) => {
        if (confirm(`Are you sure you want to delete transaction #${salesBillNo}? This action cannot be undone.`)) {
            const res = await deleteTransaction(id);
            if (res.success) {
                router.refresh();
            } else {
                alert(res.error || "Failed to delete transaction");
            }
        }
    };

    const handleBulkDelete = async () => {
        if (selectedTransactions.length === 0) return;
        const billList = selectedTransactions.map((tx) => tx.salesBillNo).join(", ");
        const preview =
            selectedTransactions.length <= 5
                ? billList
                : `${selectedTransactions
                      .slice(0, 5)
                      .map((tx) => tx.salesBillNo)
                      .join(", ")} and ${selectedTransactions.length - 5} more`;
        if (
            !confirm(
                `Delete ${selectedTransactions.length} transaction(s)?\n\n${preview}\n\nThis cannot be undone.`
            )
        ) {
            return;
        }
        setBulkActionLoading(true);
        const res = await bulkDeleteTransactions({
            transactionIds: selectedTransactions.map((tx) => tx.id),
            expandBookingGroups,
        });
        setBulkActionLoading(false);
        if (res.success) {
            setSelectedIds(new Set());
            router.refresh();
        } else {
            alert(res.error || "Failed to delete transactions");
        }
    };

    const activeData = useMemo(
        () => initialData.filter((tx) => !tx.isVoided),
        [initialData]
    );

    const globalTotals = useMemo(() => {
        return activeData.reduce(
            (acc, tx) => ({
                purchase: acc.purchase + tx.purchaseAmount,
                sales: acc.sales + tx.salesAmount,
                exempt: acc.exempt + tx.exemptAmount,
                taxable: acc.taxable + tx.taxableAmount,
                vat: acc.vat + tx.vatAmount,
                profit: acc.profit + (tx.salesAmount - tx.purchaseAmount),
            }),
            { purchase: 0, sales: 0, exempt: 0, taxable: 0, vat: 0, profit: 0 }
        );
    }, [activeData]);

    const filteredData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        return initialData.filter((tx) => {
            const matchesSearch =
                (tx.passengerNames || "").toLowerCase().includes(lowerSearch) ||
                (tx.partyName || "").toLowerCase().includes(lowerSearch) ||
                (tx.salesBillNo || "").toLowerCase().includes(lowerSearch) ||
                (tx.purchaseInvoiceNo || "").toLowerCase().includes(lowerSearch) ||
                (tx.sector || "").toLowerCase().includes(lowerSearch);

            if (!matchesSearch) return false;

            if (sectorFilter && tx.sector.toLowerCase() !== sectorFilter.toLowerCase()) return false;

            if (
                purchaseFromFilter &&
                (tx.purchasePartyName || "").toLowerCase() !== purchaseFromFilter.toLowerCase()
            ) {
                return false;
            }

            if (
                partyFilter &&
                (tx.partyName || "").toLowerCase() !== partyFilter.toLowerCase()
            ) {
                return false;
            }

            if (paymentFilter !== "ALL" && tx.paymentStatus !== paymentFilter) return false;

            if (filterType === "ALL") return true;

            if (filterType === "CUSTOM") {
                const hasDateFilter = Boolean(startDate || endDate);
                const hasBillFilter = Boolean(billNoFrom || billNoTo);
                if (!hasDateFilter && !hasBillFilter) return true;

                const dateOk =
                    !hasDateFilter ||
                    matchesDateFilter(tx, "CUSTOM", dateFieldFilter, {
                        selectedMonth,
                        selectedYear,
                        startDate,
                        endDate,
                    });
                const billOk = !hasBillFilter || matchesBillNoRange(tx.salesBillNo, billNoFrom, billNoTo);
                return dateOk && billOk;
            }

            return matchesDateFilter(tx, filterType, dateFieldFilter, {
                selectedMonth,
                selectedYear,
                startDate,
                endDate,
            });
        });
    }, [
        searchTerm,
        initialData,
        filterType,
        dateFieldFilter,
        selectedMonth,
        selectedYear,
        startDate,
        endDate,
        billNoFrom,
        billNoTo,
        paymentFilter,
        sectorFilter,
        purchaseFromFilter,
        partyFilter,
        initialTravelDate,
    ]);

    const selectedTransactions = useMemo(
        () => initialData.filter((tx) => selectedIds.has(tx.id)),
        [initialData, selectedIds]
    );

    const payableSelected = useMemo(
        () =>
            selectedTransactions.filter(
                (tx) => !tx.isVoided && tx.paymentStatus !== "PAID"
            ),
        [selectedTransactions]
    );

    const voidableSelected = useMemo(
        () => selectedTransactions.filter((tx) => !tx.isVoided),
        [selectedTransactions]
    );

    const hasLinkedSelection = useMemo(
        () => selectedTransactions.some((tx) => Boolean(tx.bookingGroupId)),
        [selectedTransactions]
    );

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const exportFilteredUrl = useMemo(() => {
        const params = new URLSearchParams({
            filterType,
            dateField: dateFieldFilter,
            excludeVoided: "true",
        });
        if (searchTerm) params.set("search", searchTerm);
        if (selectedMonth) params.set("selectedMonth", selectedMonth);
        if (selectedYear) params.set("selectedYear", selectedYear);
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        if (billNoFrom) params.set("billNoFrom", billNoFrom);
        if (billNoTo) params.set("billNoTo", billNoTo);
        return `/api/export/excel?${params.toString()}`;
    }, [filterType, dateFieldFilter, searchTerm, selectedMonth, selectedYear, startDate, endDate, billNoFrom, billNoTo]);

    const pageTotals = useMemo(() => {
        return filteredData
            .filter((tx) => !tx.isVoided)
            .reduce(
                (acc, tx) => ({
                    purchase: acc.purchase + tx.purchaseAmount,
                    sales: acc.sales + tx.salesAmount,
                    exempt: acc.exempt + tx.exemptAmount,
                    taxable: acc.taxable + tx.taxableAmount,
                    vat: acc.vat + tx.vatAmount,
                    profit: acc.profit + (tx.salesAmount - tx.purchaseAmount),
                }),
                { purchase: 0, sales: 0, exempt: 0, taxable: 0, vat: 0, profit: 0 }
            );
    }, [filteredData]);

    const sortedData = useMemo(() => {
        const copy = [...filteredData];
        copy.sort((a, b) => compareTransactions(a, b, sortKey, sortDir));
        return copy;
    }, [filteredData, sortKey, sortDir]);

    const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));

    useEffect(() => {
        setCurrentPage(1);
    }, [
        searchTerm,
        filterType,
        dateFieldFilter,
        selectedMonth,
        selectedYear,
        startDate,
        endDate,
        billNoFrom,
        billNoTo,
        paymentFilter,
        sectorFilter,
        purchaseFromFilter,
        partyFilter,
        initialTravelDate,
        sortKey,
        sortDir,
        itemsPerPage,
    ]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir(key === "billSequence" || key === "salesBillNo" ? "desc" : "asc");
        }
    };

    const toggleSelectAllPage = () => {
        const pageIds = paginatedData.map((tx) => tx.id);
        const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
            return next;
        });
    };

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];

    return (
        <div className="space-y-4">
            {sectorFilter && (
                <div className="mx-2 flex items-center gap-3 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-xl text-sm font-semibold">
                    <span>
                        Filtered by sector: <strong>{sectorFilter}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={() => setSectorFilter("")}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 text-xs font-bold"
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            )}

            {purchaseFromFilter && (
                <div className="mx-2 flex items-center gap-3 bg-violet-50 border border-violet-200 text-violet-800 px-4 py-2 rounded-xl text-sm font-semibold">
                    <span>
                        Purchased from: <strong>{purchaseFromFilter}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={() => setPurchaseFromFilter("")}
                        className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-900 text-xs font-bold"
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            )}

            {partyFilter && (
                <div className="mx-2 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-xl text-sm font-semibold">
                    <span>
                        Customer: <strong>{partyFilter}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={() => setPartyFilter("")}
                        className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-900 text-xs font-bold"
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            )}

            {initialTravelDate && startDate === initialTravelDate && endDate === initialTravelDate && (
                <div className="mx-2 flex items-center gap-3 bg-sky-50 border border-sky-200 text-sky-800 px-4 py-2 rounded-xl text-sm font-semibold">
                    <span>
                        Travel date: <strong>{initialTravelDate}</strong>
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            setFilterType("ALL");
                            setDateFieldFilter("sales");
                            setStartDate("");
                            setEndDate("");
                            router.push("/dashboard/tickets");
                        }}
                        className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-900 text-xs font-bold"
                    >
                        <X size={14} /> Clear
                    </button>
                </div>
            )}

            {canEdit && selectedIds.size > 0 && (
                <div className="mx-2 flex flex-wrap items-center justify-between gap-3 bg-brand-red/5 border border-brand-red/20 px-4 py-3 rounded-xl">
                    <span className="text-sm font-bold text-slate-700">
                        {selectedIds.size} selected
                        {payableSelected.length < selectedIds.size && (
                            <span className="text-slate-400 font-normal">
                                {" "}
                                ({payableSelected.length} unpaid)
                            </span>
                        )}
                    </span>
                    {hasLinkedSelection && (
                        <label className="flex items-center gap-2 text-xs text-violet-700 mr-2">
                            <input
                                type="checkbox"
                                checked={expandBookingGroups}
                                onChange={(e) => setExpandBookingGroups(e.target.checked)}
                                className="rounded border-violet-300"
                            />
                            Include linked booking group
                        </label>
                    )}
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedIds(new Set())}
                            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg border border-slate-200"
                        >
                            Clear selection
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowPaymentModal(true)}
                            disabled={payableSelected.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            <Banknote size={14} /> Mark as Paid
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowVoidModal(true)}
                            disabled={voidableSelected.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            <Ban size={14} /> Void Selected
                        </button>
                        <button
                            type="button"
                            onClick={handleBulkDelete}
                            disabled={bulkActionLoading}
                            className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold disabled:opacity-50"
                        >
                            <Trash2 size={14} /> Delete Selected
                        </button>
                    </div>
                </div>
            )}

            {showPaymentModal && payableSelected.length > 0 && (
                <BulkPaymentModal
                    selected={payableSelected}
                    onClose={() => setShowPaymentModal(false)}
                    onSuccess={() => {
                        setSelectedIds(new Set());
                        router.refresh();
                    }}
                />
            )}

            {showVoidModal && voidableSelected.length > 0 && (
                <BulkVoidModal
                    selected={selectedTransactions}
                    onClose={() => setShowVoidModal(false)}
                    onSuccess={() => {
                        setShowVoidModal(false);
                        setSelectedIds(new Set());
                        router.refresh();
                    }}
                />
            )}

            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm mx-2 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Quick search..."
                            className="w-full bg-slate-50 border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-slate-900 focus:ring-brand-red focus:border-brand-red text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(["ALL", "MONTH", "YEAR", "CUSTOM"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setFilterType(type);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        filterType === type
                                            ? "bg-white text-brand-red shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {type === "ALL"
                                        ? "All Data"
                                        : type === "MONTH"
                                          ? "Monthly"
                                          : type === "YEAR"
                                            ? "Yearly"
                                            : "Custom Range"}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(["ALL", "UNPAID", "PARTIAL", "PAID"] as const).map((status) => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setPaymentFilter(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                        paymentFilter === status
                                            ? "bg-white text-brand-red shadow-sm"
                                            : "text-slate-500 hover:text-slate-700"
                                    }`}
                                >
                                    {status === "ALL" ? "All Payments" : status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filterType !== "ALL" && (
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Filter size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Configure Filter:</span>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-100">
                            {(["sales", "travel"] as const).map((field) => (
                                <button
                                    key={field}
                                    onClick={() => {
                                        setDateFieldFilter(field);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase ${
                                        dateFieldFilter === field
                                            ? "bg-white text-brand-red shadow-sm"
                                            : "text-slate-500"
                                    }`}
                                >
                                    {field === "sales" ? "Sales Date" : "Travel Date"}
                                </button>
                            ))}
                        </div>

                        {filterType === "MONTH" && (
                            <>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                                >
                                    {months.map((m, i) => (
                                        <option key={m} value={i.toString()}>
                                            {m}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                                >
                                    {years.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterType === "YEAR" && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        )}

                        {filterType === "CUSTOM" && (
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Date</span>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                                    />
                                    <span className="text-slate-300">to</span>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400">Bill No</span>
                                    <input
                                        type="text"
                                        placeholder="From e.g. 2083-001"
                                        value={billNoFrom}
                                        onChange={(e) => setBillNoFrom(e.target.value)}
                                        className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red w-32 font-mono"
                                    />
                                    <span className="text-slate-300">to</span>
                                    <input
                                        type="text"
                                        placeholder="To e.g. 2083-050"
                                        value={billNoTo}
                                        onChange={(e) => setBillNoTo(e.target.value)}
                                        className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red w-32 font-mono"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="ml-auto text-slate-400 text-[10px] font-bold">
                            Showing <span className="text-slate-900">{filteredData.length}</span> results
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3 px-2 items-center">
                <a
                    href={exportFilteredUrl}
                    className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs border border-slate-200 shadow-sm"
                >
                    Export Filtered
                </a>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col min-w-[120px] shadow-sm">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Total Sales (Filtered)</span>
                    <span className="text-sm font-black text-slate-900 tabular-nums">{formatNumber(pageTotals.sales)}</span>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col min-w-[120px] shadow-sm">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Total VAT (Filtered)</span>
                    <span className="text-sm font-black text-emerald-600 tabular-nums">{formatNumber(pageTotals.vat)}</span>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col min-w-[120px] shadow-sm">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Net Profit (Filtered)</span>
                    <span className="text-sm font-black text-brand-red tabular-nums">{formatNumber(pageTotals.profit)}</span>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mx-2 overflow-hidden">
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                                {canEdit && (
                                    <th className="px-3 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAllPage}
                                            title="Select all on this page"
                                            className="rounded border-slate-300"
                                        />
                                    </th>
                                )}
                                <SortableHeader label="S.N." sortKeyName="billSequence" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="center" />
                                <SortableHeader label="Bill No" sortKeyName="salesBillNo" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Purchase Inv. No" sortKeyName="purchaseInvoiceNo" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Purchase Bill Date" sortKeyName="purchaseDate" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Travel Date" sortKeyName="travelDate" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Sales Date" sortKeyName="salesDate" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Passenger(s)" sortKeyName="passengerNames" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Party" sortKeyName="partyName" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Sector" sortKeyName="sector" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} />
                                <SortableHeader label="Purchase Amt" sortKeyName="purchaseAmount" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                                <SortableHeader label="Sale Amt" sortKeyName="salesAmount" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                                <SortableHeader label="Exempt" sortKeyName="exemptAmount" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                                <SortableHeader label="Taxable" sortKeyName="taxableAmount" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                                <SortableHeader label="VAT (13%)" sortKeyName="vatAmount" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                                <SortableHeader label="Net Profit" sortKeyName="netProfit" activeKey={sortKey} activeDir={sortDir} onSort={handleSort} align="right" />
                                <th className="px-4 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.map((tx) => {
                                const netProfit = tx.salesAmount - tx.purchaseAmount;
                                const ownSales = isOwnSalesBill(tx);
                                const supplierMissing =
                                    !ownSales && isPurchasePartyUnset(tx.purchasePartyName);
                                const paymentMethodLabel = displayPaymentMethod(
                                    tx.receivedStatus,
                                    tx.paymentStatus
                                );
                                return (
                                    <tr
                                        key={tx.id}
                                        className={`transition-colors group ${
                                            selectedIds.has(tx.id)
                                                ? "bg-brand-red/5"
                                                : tx.isVoided
                                                  ? "bg-slate-50/80 opacity-60"
                                                  : supplierMissing
                                                    ? "bg-orange-50/40 hover:bg-orange-50/70"
                                                    : "hover:bg-slate-50"
                                        }`}
                                        title={tx.isVoided ? tx.voidReason || "Voided" : undefined}
                                    >
                                        {canEdit && (
                                            <td className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(tx.id)}
                                                    onChange={() => toggleSelect(tx.id)}
                                                    className="rounded border-slate-300"
                                                />
                                            </td>
                                        )}
                                        <td className="px-4 py-3 text-center text-slate-600 font-mono text-xs font-bold whitespace-nowrap">
                                            {tx.billSequence ?? "—"}
                                        </td>
                                        <td className="px-4 py-3 text-brand-red font-mono text-xs font-bold whitespace-nowrap">
                                            <div>{tx.salesBillNo}</div>
                                            {tx.bookingGroupId && tx.billingMode === "SPLIT" && (
                                                <span className="text-[9px] font-bold uppercase text-violet-600">
                                                    Linked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 font-mono text-xs truncate max-w-[120px]" title={tx.purchaseInvoiceNo}>
                                            {tx.purchaseInvoiceNo || "—"}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {tx.purchaseDate ? (
                                                <>
                                                    <div className="text-slate-900 font-medium">
                                                        {formatDisplayDate(tx.purchaseDate)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">{tx.purchaseDateBS}</div>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {tx.travelDate ? (
                                                <>
                                                    <div className="text-slate-900 font-medium">
                                                        {formatDisplayDate(tx.travelDate)}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">{tx.travelDateBS}</div>
                                                </>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-slate-900 font-medium">
                                                {formatDisplayDate(tx.salesDate)}
                                            </div>
                                            <div className="text-[10px] text-slate-400">{tx.salesDateBS}</div>
                                        </td>
                                        <td className="px-4 py-3 min-w-[150px]">
                                            <div
                                                className="text-slate-900 font-semibold truncate max-w-[180px]"
                                                title={tx.passengerNames}
                                            >
                                                {formatPassengerNames(tx.passengerNames)}
                                            </div>
                                            <div className="flex flex-wrap gap-2 text-[9px] uppercase font-bold tracking-tighter">
                                                {ownSales && (
                                                    <span className="px-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
                                                        Own
                                                    </span>
                                                )}
                                                {supplierMissing && (
                                                    <span
                                                        className="px-1 rounded bg-orange-100 text-orange-800 border border-orange-200"
                                                        title={`Purchasing partner not set (${tx.purchasePartyName || "empty"})`}
                                                    >
                                                        No supplier
                                                    </span>
                                                )}
                                                {tx.isVoided && (
                                                    <span className="px-1 rounded bg-slate-200 text-slate-600">
                                                        VOID
                                                    </span>
                                                )}
                                                {tx.refundStatus === "FULL" && (
                                                    <span className="px-1 rounded bg-violet-100 text-violet-700">
                                                        REFUNDED
                                                    </span>
                                                )}
                                                {tx.refundStatus === "PARTIAL" && (
                                                    <span className="px-1 rounded bg-violet-50 text-violet-600 border border-violet-200">
                                                        PARTIAL REFUND
                                                    </span>
                                                )}
                                                <span
                                                    className={`px-1 rounded ${
                                                        tx.paymentStatus === "PAID"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : tx.paymentStatus === "PARTIAL"
                                                              ? "bg-amber-100 text-amber-700"
                                                              : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {tx.paymentStatus}
                                                </span>
                                                {paymentMethodLabel && (
                                                    <span
                                                        className={`px-1 rounded ${
                                                            paymentMethodLabel === "BANK"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : paymentMethodLabel === "CASH"
                                                                  ? "bg-blue-100 text-blue-700"
                                                                  : paymentMethodLabel === "CHEQUE"
                                                                    ? "bg-violet-100 text-violet-700"
                                                                    : "bg-amber-100 text-amber-700"
                                                        }`}
                                                    >
                                                        {paymentMethodLabel}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 truncate max-w-[120px]">{tx.partyName}</td>
                                        <td className="px-4 py-3 text-slate-500 font-medium">{tx.sector}</td>
                                        <td className="px-4 py-3 text-right text-slate-500 font-mono italic tabular-nums">
                                            {formatNumber(tx.purchaseAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-900 font-bold font-mono tabular-nums">
                                            {formatNumber(tx.salesAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-400 font-mono italic tabular-nums">
                                            {formatNumber(tx.exemptAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-700 font-mono tabular-nums">
                                            {formatNumber(tx.taxableAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-medium font-mono tabular-nums">
                                            {formatNumber(tx.vatAmount)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-brand-red font-black font-mono tabular-nums">
                                            {formatNumber(netProfit)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex gap-1 justify-center">
                                                <Link
                                                    href={`/dashboard/tickets/${tx.id}`}
                                                    className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={14} />
                                                </Link>
                                                <Link
                                                    href={`/dashboard/tickets/${tx.id}/bill`}
                                                    className="p-1.5 bg-brand-red/5 rounded-lg text-brand-red hover:bg-brand-red hover:text-white transition-colors"
                                                    title="Print Bill"
                                                >
                                                    <FileCheck size={14} />
                                                </Link>
                                                {canEdit && !tx.isVoided && (
                                                    <Link
                                                        href={`/dashboard/tickets/${tx.id}/edit`}
                                                        className="p-1.5 bg-blue-50 rounded-lg text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                                                        title="Edit Transaction"
                                                    >
                                                        <Pencil size={14} />
                                                    </Link>
                                                )}
                                                {canEdit && (
                                                    <VoidTransactionButton
                                                        id={tx.id}
                                                        salesBillNo={tx.salesBillNo}
                                                        isVoided={tx.isVoided}
                                                    />
                                                )}
                                                {canEdit && (
                                                    <RefundTransactionButton
                                                        id={tx.id}
                                                        salesBillNo={tx.salesBillNo}
                                                        salesAmount={tx.salesAmount}
                                                        purchaseAmount={tx.purchaseAmount}
                                                        amountReceived={tx.amountReceived}
                                                        isVoided={tx.isVoided}
                                                        refundStatus={tx.refundStatus}
                                                        priorCustomerRefund={tx.priorCustomerRefund}
                                                        priorSupplierCredit={tx.priorSupplierCredit}
                                                        priorCashRefund={tx.priorCashRefund}
                                                    />
                                                )}
                                                {canEdit && !tx.isVoided && (
                                                    <button
                                                        onClick={() => handleDelete(tx.id, tx.salesBillNo)}
                                                        className="p-1.5 bg-red-50 rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                                                        title="Delete Transaction"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold divide-y divide-slate-200">
                            <tr className="text-slate-500 text-[10px]">
                                <td colSpan={canEdit ? 10 : 9} className="px-4 py-4 text-right uppercase tracking-widest font-black">
                                    Filtered View Total:
                                </td>
                                <td className="px-4 py-4 text-right font-mono italic tabular-nums">{formatNumber(pageTotals.purchase)}</td>
                                <td className="px-4 py-4 text-right text-slate-600 font-mono tabular-nums">{formatNumber(pageTotals.sales)}</td>
                                <td className="px-4 py-4 text-right font-mono text-slate-400 italic tabular-nums">{formatNumber(pageTotals.exempt)}</td>
                                <td className="px-4 py-4 text-right font-mono text-slate-500 tabular-nums">{formatNumber(pageTotals.taxable)}</td>
                                <td className="px-4 py-4 text-right text-emerald-600/70 font-mono tabular-nums">{formatNumber(pageTotals.vat)}</td>
                                <td className="px-4 py-4 text-right text-brand-red/70 font-mono tabular-nums">{formatNumber(pageTotals.profit)}</td>
                                <td></td>
                            </tr>
                            <tr className="text-slate-900 bg-white">
                                <td colSpan={canEdit ? 10 : 9} className="px-4 py-6 text-right uppercase tracking-[0.2em] font-black text-brand-red">
                                    Grand Total (Registry):
                                </td>
                                <td className="px-4 py-6 text-right text-slate-500 font-mono tabular-nums">{formatNumber(globalTotals.purchase)}</td>
                                <td className="px-4 py-6 text-right text-slate-900 font-black font-mono text-lg tabular-nums">
                                    {formatNumber(globalTotals.sales)}
                                </td>
                                <td className="px-4 py-6 text-right text-slate-400 font-mono tabular-nums">{formatNumber(globalTotals.exempt)}</td>
                                <td className="px-4 py-6 text-right text-slate-500 font-mono tabular-nums">{formatNumber(globalTotals.taxable)}</td>
                                <td className="px-4 py-6 text-right text-emerald-600 font-black font-mono tabular-nums">{formatNumber(globalTotals.vat)}</td>
                                <td className="px-4 py-6 text-right text-brand-red font-black font-mono text-lg bg-brand-red/5 tabular-nums">
                                    {formatNumber(globalTotals.profit)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="bg-white px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                            {sortedData.length === 0
                                ? "No records"
                                : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, sortedData.length)} of ${sortedData.length}`}
                        </div>
                        <label className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                            Rows
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 normal-case"
                            >
                                {PAGE_SIZE_OPTIONS.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => prev - 1)}
                            className="p-2 rounded-lg bg-slate-50 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-500">
                            Page
                            <select
                                value={currentPage}
                                onChange={(e) => setCurrentPage(Number(e.target.value))}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 min-w-[4rem]"
                            >
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <option key={page} value={page}>
                                        {page}
                                    </option>
                                ))}
                            </select>
                            <span className="text-slate-400">of {totalPages}</span>
                        </label>
                        <button
                            disabled={currentPage === totalPages || sortedData.length === 0}
                            onClick={() => setCurrentPage((prev) => prev + 1)}
                            className="p-2 rounded-lg bg-slate-50 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
