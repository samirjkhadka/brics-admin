"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import type { MonthlyTrendPoint } from "@/lib/dashboard/trends.constants";
import { FISCAL_MONTH_ORDER } from "@/lib/dashboard/trends.constants";

type FiscalYearOption = {
    id: string;
    label: string;
    status: string;
};

export default function MonthlyTrendsChart({
    chartData,
    fiscalYears,
    selectedFyId,
    selectedMonthIndices,
}: {
    chartData: MonthlyTrendPoint[];
    fiscalYears: FiscalYearOption[];
    selectedFyId: string;
    selectedMonthIndices: number[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const visibleData = useMemo(() => {
        if (selectedMonthIndices.length === 0) return chartData;
        const set = new Set(selectedMonthIndices);
        return chartData.filter((d) => set.has(d.monthIndex));
    }, [chartData, selectedMonthIndices]);

    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(updates)) {
            if (value === null) params.delete(key);
            else params.set(key, value);
        }
        router.push(`/dashboard?${params.toString()}`);
    };

    const handleFyChange = (fyId: string) => {
        updateParams({ fy: fyId, months: null });
    };

    const toggleMonth = (monthIndex: number) => {
        const current = new Set(selectedMonthIndices.length ? selectedMonthIndices : FISCAL_MONTH_ORDER.map((m) => m.monthIndex));
        if (current.has(monthIndex)) {
            if (current.size === 1) return;
            current.delete(monthIndex);
        } else {
            current.add(monthIndex);
        }
        const sorted = [...current].sort((a, b) => a - b);
        updateParams({ months: sorted.join(",") });
    };

    const selectAllMonths = () => updateParams({ months: null });
    const selectedFy = fiscalYears.find((fy) => fy.id === selectedFyId);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-900">Monthly Trends</h3>
                    <p className="text-sm text-slate-500">
                        Sales, profit, and VAT by BS month
                        {selectedFy ? ` · FY ${selectedFy.label}` : ""}
                    </p>
                </div>
                <select
                    value={selectedFyId}
                    onChange={(e) => handleFyChange(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 shrink-0"
                >
                    {fiscalYears.map((fy) => (
                        <option key={fy.id} value={fy.id}>
                            FY {fy.label} {fy.status === "OPEN" ? "(Active)" : ""}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                        Compare months:
                    </span>
                    <button
                        type="button"
                        onClick={selectAllMonths}
                        className="text-[10px] font-bold text-brand-red hover:underline uppercase"
                    >
                        All FY months
                    </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {FISCAL_MONTH_ORDER.map(({ monthIndex, label }) => {
                        const active =
                            selectedMonthIndices.length === 0 || selectedMonthIndices.includes(monthIndex);
                        return (
                            <button
                                key={monthIndex}
                                type="button"
                                onClick={() => toggleMonth(monthIndex)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border transition-colors ${
                                    active
                                        ? "bg-brand-red/10 border-brand-red/30 text-brand-red"
                                        : "bg-slate-50 border-slate-200 text-slate-400"
                                }`}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={visibleData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                            formatter={(value: number) =>
                                new Intl.NumberFormat("en-NP", {
                                    style: "currency",
                                    currency: "NPR",
                                    maximumFractionDigits: 0,
                                }).format(value)
                            }
                        />
                        <Legend />
                        <Line type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="vat" name="VAT" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
