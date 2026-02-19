import db from "@/lib/db";
import { DollarSign, FileCheck, TrendingUp, Users, ArrowUpRight, ArrowDownRight, Plane } from "lucide-react";
import Link from "next/link";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { formatNPR } from "@/lib/utils/format-currency";

export default async function DashboardPage() {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    // Current Month Stats
    const currentStats = await db.transaction.aggregate({
        where: {
            createdAt: { gte: currentMonthStart, lte: currentMonthEnd }
        },
        _sum: { salesAmount: true, purchaseAmount: true, vatAmount: true }
    });

    // Last Month Stats for Trends
    const lastStats = await db.transaction.aggregate({
        where: {
            createdAt: { gte: lastMonthStart, lte: lastMonthEnd }
        },
        _sum: { salesAmount: true, purchaseAmount: true }
    });

    const currentSales = currentStats._sum.salesAmount || 0;
    const currentProfit = currentSales - (currentStats._sum.purchaseAmount || 0);
    const lastSales = lastStats._sum.salesAmount || 0;
    const lastProfit = lastSales - (lastStats._sum.purchaseAmount || 0);

    const salesTrend = lastSales === 0 ? 100 : ((currentSales - lastSales) / lastSales) * 100;
    const profitTrend = lastProfit === 0 ? 100 : ((currentProfit - lastProfit) / lastProfit) * 100;

    const transactions = await db.transaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
    });

    // Upcoming Flights for Current Month
    const upcomingFlights = await db.transaction.findMany({
        where: {
            travelDate: { gte: currentMonthStart, lte: currentMonthEnd }
        },
        orderBy: { travelDate: 'asc' },
        take: 5
    });

    const statCards = [
        {
            name: "Total Sales (Monthly)",
            value: formatNPR(currentSales),
            trend: salesTrend,
            icon: DollarSign,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        {
            name: "Total VAT Payable",
            value: formatNPR(currentStats._sum.vatAmount || 0),
            icon: FileCheck,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        {
            name: "Net Profit (Monthly)",
            value: formatNPR(currentProfit),
            trend: profitTrend,
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
        },
    ];

    return (
        <div className="space-y-8 px-4 py-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Oversight</h1>
                    <p className="text-slate-500 mt-1">Financial performance for {now.toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <div className="flex gap-4">
                    <a href="/api/export/excel" className="bg-white hover:bg-slate-50 text-slate-700 px-6 py-2.5 rounded-lg font-bold transition-all border border-slate-200 flex items-center gap-2 shadow-sm">
                        Download Excel
                    </a>
                    <Link href="/dashboard/tickets/new" className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2.5 rounded-lg font-black transition-all shadow-lg shadow-brand-red/20 active:scale-95">
                        + New Entry
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.name} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.name}</p>
                                    <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
                                </div>
                            </div>
                            {stat.trend !== undefined && (
                                <div className={`flex items-center text-xs font-bold gap-0.5 ${stat.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {stat.trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                    {Math.abs(stat.trend).toFixed(1)}%
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transactions Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-black text-slate-900">Recent Transactions</h3>
                        <Link href="/dashboard/tickets" className="text-sm text-brand-red font-bold hover:underline">View All</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                                    <th className="px-6 py-4">Passengers</th>
                                    <th className="px-6 py-4">Bill No</th>
                                    <th className="px-6 py-4">Sales Date (BS)</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-slate-900 max-w-[200px] truncate" title={tx.passengerNames}>
                                                {(() => {
                                                    try {
                                                        const parsed = JSON.parse(tx.passengerNames);
                                                        return Array.isArray(parsed) ? parsed.map(p => p.name).join(", ") : tx.passengerNames;
                                                    } catch {
                                                        return tx.passengerNames;
                                                    }
                                                })()}
                                            </div>
                                            <div className="text-xs text-slate-400">{tx.sector}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-slate-500">{tx.salesBillNo}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{tx.salesDateBS}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-slate-900">{formatNPR(tx.salesAmount)}</div>
                                            <div className="text-xs text-emerald-600 font-medium">VAT: {formatNPR(tx.vatAmount)}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${tx.receivedStatus === "BANK" ? "bg-emerald-100 text-emerald-700" :
                                                tx.receivedStatus === "CASH" ? "bg-blue-100 text-blue-700" :
                                                    "bg-amber-100 text-amber-700"
                                                }`}>
                                                {tx.receivedStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/dashboard/tickets/${tx.id}`} className="text-brand-red hover:text-brand-red-dark transition-colors text-sm font-black">
                                                Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Upcoming Flights Section */}
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm h-fit">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                            <Plane size={20} className="text-brand-red" />
                            Upcoming Flights
                        </h3>
                    </div>
                    <div className="p-6 space-y-4">
                        {upcomingFlights.length > 0 ? upcomingFlights.map((flight) => (
                            <div key={flight.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex-shrink-0 bg-brand-red/10 text-brand-red p-2 rounded-lg text-center min-w-[50px]">
                                    <div className="text-[10px] font-black uppercase">{flight.travelDate?.toLocaleDateString('en-US', { month: 'short' })}</div>
                                    <div className="text-lg font-black leading-none">{flight.travelDate?.getDate()}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">
                                        {(() => {
                                            try {
                                                const parsed = JSON.parse(flight.passengerNames);
                                                return Array.isArray(parsed) ? parsed.map(p => p.name).join(", ") : flight.passengerNames;
                                            } catch {
                                                return flight.passengerNames;
                                            }
                                        })()}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate font-medium">{flight.sector}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-slate-500 py-8 text-sm italic">No flights scheduled for this month.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
