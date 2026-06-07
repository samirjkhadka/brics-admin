"use client";

import Link from "next/link";
import RouteAnalyticsCharts from "@/components/dashboard/route-analytics-charts";
import { formatNPR } from "@/lib/utils/format-currency";

export type SectorAnalyticsRow = {
    sector: string;
    sectorLabel: string;
    count: number;
    sales: number;
    purchase: number;
    profit: number;
};

export type AirportUsageRow = {
    code: string;
    label: string;
    count: number;
};

export type RouteUsageRow = {
    sector: string;
    label: string;
    count: number;
};

type SectorAnalyticsClientProps = {
    rows: SectorAnalyticsRow[];
    airportUsage: AirportUsageRow[];
    routeUsage: RouteUsageRow[];
    totalTickets: number;
    totalProfit: number;
};

export default function SectorAnalyticsClient({
    rows,
    airportUsage,
    routeUsage,
    totalTickets,
    totalProfit,
}: SectorAnalyticsClientProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase text-slate-500">Sectors</span>
                    <p className="text-2xl font-black mt-1">{rows.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase text-slate-500">Total Tickets</span>
                    <p className="text-2xl font-black mt-1">{totalTickets}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <span className="text-xs font-bold uppercase text-slate-500">Total Profit</span>
                    <p className="text-2xl font-black mt-1 text-brand-red">{formatNPR(totalProfit)}</p>
                </div>
            </div>

            <RouteAnalyticsCharts data={{ airportUsage, routeUsage }} />

            <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm">
                <table className="w-full text-sm min-w-[720px]">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <th className="px-5 py-3 text-left min-w-[300px] w-[38%]">Sector</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Tickets</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Sales</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Purchase</th>
                            <th className="px-4 py-3 text-right whitespace-nowrap">Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((r) => (
                            <tr key={r.sector} className="hover:bg-slate-50">
                                <td className="px-5 py-4 align-top">
                                    <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-normal break-words">
                                        {r.sectorLabel}
                                    </div>
                                    <div className="text-xs font-mono text-slate-400 mt-1.5 tracking-wide">
                                        {r.sector}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Link
                                        href={`/dashboard/tickets?sector=${encodeURIComponent(r.sector)}`}
                                        className="inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg bg-brand-red/10 text-brand-red font-bold hover:bg-brand-red hover:text-white transition-colors"
                                        title={`View ${r.count} tickets for ${r.sector}`}
                                    >
                                        {r.count}
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-right font-mono">{formatNPR(r.sales)}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-500">
                                    {formatNPR(r.purchase)}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">
                                    {formatNPR(r.profit)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
