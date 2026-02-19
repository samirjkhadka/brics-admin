"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Eye, FileCheck, Filter, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { formatNPR } from "@/lib/utils/format-currency";

interface Transaction {
    id: string;
    passengerNames: string;
    partyName: string;
    sector: string;
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
}

export default function TransactionsTableClient({ initialData }: { initialData: Transaction[] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter State
    const [filterType, setFilterType] = useState<'ALL' | 'MONTH' | 'YEAR' | 'CUSTOM'>('ALL');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const globalTotals = useMemo(() => {
        return initialData.reduce((acc, tx) => ({
            purchase: acc.purchase + tx.purchaseAmount,
            sales: acc.sales + tx.salesAmount,
            exempt: acc.exempt + tx.exemptAmount,
            taxable: acc.taxable + tx.taxableAmount,
            vat: acc.vat + tx.vatAmount,
            profit: acc.profit + (tx.salesAmount - tx.purchaseAmount)
        }), { purchase: 0, sales: 0, exempt: 0, taxable: 0, vat: 0, profit: 0 });
    }, [initialData]);

    const itemsPerPage = 15;

    const filteredData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();

        return initialData.filter(tx => {
            // 1. Text Search Filter
            const matchesSearch =
                (tx.passengerNames || "").toLowerCase().includes(lowerSearch) ||
                (tx.partyName || "").toLowerCase().includes(lowerSearch) ||
                (tx.salesBillNo || "").toLowerCase().includes(lowerSearch) ||
                (tx.purchaseInvoiceNo || "").toLowerCase().includes(lowerSearch) ||
                (tx.sector || "").toLowerCase().includes(lowerSearch);

            if (!matchesSearch) return false;

            // 2. Date Filter
            const txDate = new Date(tx.salesDate);

            if (filterType === 'MONTH') {
                return txDate.getMonth().toString() === selectedMonth &&
                    txDate.getFullYear().toString() === selectedYear;
            }

            if (filterType === 'YEAR') {
                return txDate.getFullYear().toString() === selectedYear;
            }

            if (filterType === 'CUSTOM') {
                if (!startDate && !endDate) return true;
                const start = startDate ? new Date(startDate) : new Date(0);
                const end = endDate ? new Date(endDate) : new Date();
                // Normalize dates to start/end of day for accurate range comparison
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return txDate >= start && txDate <= end;
            }

            return true; // ALL
        });
    }, [searchTerm, initialData, filterType, selectedMonth, selectedYear, startDate, endDate]);

    const pageTotals = useMemo(() => {
        return filteredData.reduce((acc, tx) => ({
            purchase: acc.purchase + tx.purchaseAmount,
            sales: acc.sales + tx.salesAmount,
            exempt: acc.exempt + tx.exemptAmount,
            taxable: acc.taxable + tx.taxableAmount,
            vat: acc.vat + tx.vatAmount,
            profit: acc.profit + (tx.salesAmount - tx.purchaseAmount)
        }), { purchase: 0, sales: 0, exempt: 0, taxable: 0, vat: 0, profit: 0 });
    }, [filteredData]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString());
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return (
        <div className="space-y-4">
            {/* Filter Toolbar */}
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
                            {(['ALL', 'MONTH', 'YEAR', 'CUSTOM'] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => {
                                        setFilterType(type);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === type
                                        ? 'bg-white text-brand-red shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {type === 'ALL' ? 'All Data' :
                                        type === 'MONTH' ? 'Monthly' :
                                            type === 'YEAR' ? 'Yearly' : 'Custom Range'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Conditional Filter Inputs */}
                {filterType !== 'ALL' && (
                    <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Filter size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Configure Filter:</span>
                        </div>

                        {filterType === 'MONTH' && (
                            <>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                                >
                                    {months.map((m, i) => (
                                        <option key={m} value={i.toString()}>{m}</option>
                                    ))}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                                >
                                    {years.map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </>
                        )}

                        {filterType === 'YEAR' && (
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="bg-slate-50 border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 focus:ring-brand-red"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        )}

                        {filterType === 'CUSTOM' && (
                            <div className="flex items-center gap-2">
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
                        )}

                        <div className="ml-auto text-slate-400 text-[10px] font-bold">
                            Showing <span className="text-slate-900">{filteredData.length}</span> results
                        </div>
                    </div>
                )}
            </div>

            {/* Global Summary Stats */}
            <div className="flex justify-end gap-3 px-2">
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col min-w-[120px] shadow-sm">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Total Sales (Filtered)</span>
                    <span className="text-sm font-black text-slate-900">{formatNPR(pageTotals.sales)}</span>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col min-w-[120px] shadow-sm">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Total VAT (Filtered)</span>
                    <span className="text-sm font-black text-emerald-600">{formatNPR(pageTotals.vat)}</span>
                </div>
                <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl flex flex-col min-w-[120px] shadow-sm">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Net Profit (Filtered)</span>
                    <span className="text-sm font-black text-brand-red">{formatNPR(pageTotals.profit)}</span>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mx-2 overflow-hidden">
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                                <th className="px-4 py-4 whitespace-nowrap">Date (AD/BS)</th>
                                <th className="px-4 py-4">Passenger(s)</th>
                                <th className="px-4 py-4">Party</th>
                                <th className="px-4 py-4">Sector</th>
                                <th className="px-4 py-4 text-right">Purchase Amt</th>
                                <th className="px-4 py-4 text-right">Sale Amt</th>
                                <th className="px-4 py-4 text-right">Exempt</th>
                                <th className="px-4 py-4 text-right">Taxable</th>
                                <th className="px-4 py-4 text-right">VAT (13%)</th>
                                <th className="px-4 py-4 text-right">Net Profit</th>
                                <th className="px-4 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.map((tx) => {
                                const netProfit = tx.salesAmount - tx.purchaseAmount;
                                return (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="text-slate-900 font-medium">{new Date(tx.salesDate).toLocaleDateString()}</div>
                                            <div className="text-[10px] text-slate-400">{tx.salesDateBS}</div>
                                        </td>
                                        <td className="px-4 py-3 min-w-[150px]">
                                            <div className="text-slate-900 font-semibold truncate max-w-[180px]" title={tx.passengerNames}>
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(tx.passengerNames);
                                                        return Array.isArray(parsed) ? parsed.map(p => p.name).join(", ") : tx.passengerNames;
                                                    } catch {
                                                        return tx.passengerNames;
                                                    }
                                                })()}
                                            </div>
                                            <div className="flex gap-2 text-[9px] uppercase font-bold tracking-tighter">
                                                <span className="text-brand-red font-mono">#{tx.salesBillNo}</span>
                                                <span className={`px-1 rounded ${tx.receivedStatus === "BANK" ? "bg-emerald-100 text-emerald-700" :
                                                    tx.receivedStatus === "CASH" ? "bg-blue-100 text-blue-700" :
                                                        "bg-amber-100 text-amber-700"
                                                    }`}>{tx.receivedStatus}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 truncate max-w-[120px]">{tx.partyName}</td>
                                        <td className="px-4 py-3 text-slate-500 font-medium">{tx.sector}</td>
                                        <td className="px-4 py-3 text-right text-slate-500 font-mono italic">{formatNPR(tx.purchaseAmount)}</td>
                                        <td className="px-4 py-3 text-right text-slate-900 font-bold font-mono">{formatNPR(tx.salesAmount)}</td>
                                        <td className="px-4 py-3 text-right text-slate-400 font-mono italic">{formatNPR(tx.exemptAmount)}</td>
                                        <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatNPR(tx.taxableAmount)}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-medium font-mono">{formatNPR(tx.vatAmount)}</td>
                                        <td className="px-4 py-3 text-right text-brand-red font-black font-mono">{formatNPR(netProfit)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex gap-1 justify-center">
                                                <Link href={`/dashboard/tickets/${tx.id}`} className="p-1.5 bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors" title="View Details">
                                                    <Eye size={14} />
                                                </Link>
                                                <Link href={`/dashboard/tickets/${tx.id}/bill`} className="p-1.5 bg-brand-red/5 rounded-lg text-brand-red hover:bg-brand-red hover:text-white transition-colors" title="Print Bill">
                                                    <FileCheck size={14} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {/* Summary Footer */}
                        <tfoot className="bg-slate-50 font-bold divide-y divide-slate-200">
                            {/* Page Totals */}
                            <tr className="text-slate-500 text-[10px]">
                                <td colSpan={4} className="px-4 py-4 text-right uppercase tracking-widest font-black">Filtered View Total:</td>
                                <td className="px-4 py-4 text-right font-mono italic">{formatNPR(pageTotals.purchase)}</td>
                                <td className="px-4 py-4 text-right text-slate-600 font-mono">{formatNPR(pageTotals.sales)}</td>
                                <td className="px-4 py-4 text-right font-mono text-slate-400 italic">{formatNPR(pageTotals.exempt)}</td>
                                <td className="px-4 py-4 text-right font-mono text-slate-500">{formatNPR(pageTotals.taxable)}</td>
                                <td className="px-4 py-4 text-right text-emerald-600/70 font-mono">{formatNPR(pageTotals.vat)}</td>
                                <td className="px-4 py-4 text-right text-brand-red/70 font-mono">{formatNPR(pageTotals.profit)}</td>
                                <td></td>
                            </tr>
                            {/* Grand Totals */}
                            <tr className="text-slate-900 bg-white">
                                <td colSpan={4} className="px-4 py-6 text-right uppercase tracking-[0.2em] font-black text-brand-red">Grand Total (Registry):</td>
                                <td className="px-4 py-6 text-right text-slate-500 font-mono">{formatNPR(globalTotals.purchase)}</td>
                                <td className="px-4 py-6 text-right text-slate-900 font-black font-mono text-lg">{formatNPR(globalTotals.sales)}</td>
                                <td className="px-4 py-6 text-right text-slate-400 font-mono">{formatNPR(globalTotals.exempt)}</td>
                                <td className="px-4 py-6 text-right text-slate-500 font-mono">{formatNPR(globalTotals.taxable)}</td>
                                <td className="px-4 py-6 text-right text-emerald-600 font-black font-mono">{formatNPR(globalTotals.vat)}</td>
                                <td className="px-4 py-6 text-right text-brand-red font-black font-mono text-lg bg-brand-red/5">{formatNPR(globalTotals.profit)}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="bg-white px-4 py-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
                    </div>
                    <div className="flex gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => prev - 1)}
                            className="p-2 rounded-lg bg-slate-50 text-slate-600 disabled:opacity-30 hover:bg-slate-100 transition-colors border border-slate-200"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center px-4 text-xs font-bold text-slate-500">
                            Page {currentPage} of {totalPages || 1}
                        </div>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => prev + 1)}
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
