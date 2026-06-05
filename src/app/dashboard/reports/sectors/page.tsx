import db from "@/lib/db";
import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import { formatNPR } from "@/lib/utils/format-currency";
import Link from "next/link";
import { Plane } from "lucide-react";

export default async function SectorAnalyticsPage() {
    const transactions = await db.transaction.findMany({
        where: { isVoided: false },
        select: { sector: true, salesAmount: true, purchaseAmount: true },
    });

    const map = new Map<string, { count: number; sales: number; purchase: number }>();
    for (const tx of transactions) {
        const cur = map.get(tx.sector) || { count: 0, sales: 0, purchase: 0 };
        cur.count += 1;
        cur.sales += Number(tx.salesAmount);
        cur.purchase += Number(tx.purchaseAmount);
        map.set(tx.sector, cur);
    }

    const rows = Array.from(map.entries())
        .map(([sector, d]) => ({ sector, ...d, profit: d.sales - d.purchase }))
        .sort((a, b) => b.profit - a.profit);

    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-red/10 rounded-xl">
                        <Plane className="text-brand-red" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Sector Analytics</h1>
                        <p className="text-sm text-slate-500">Click ticket count to view in All Transactions</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-bold uppercase text-slate-500">Sectors</span>
                        <p className="text-2xl font-black mt-1">{rows.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-bold uppercase text-slate-500">Total Tickets</span>
                        <p className="text-2xl font-black mt-1">{transactions.length}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <span className="text-xs font-bold uppercase text-slate-500">Total Profit</span>
                        <p className="text-2xl font-black mt-1 text-brand-red">{formatNPR(totalProfit)}</p>
                    </div>
                </div>

                <table className="w-full bg-white border border-slate-200 rounded-2xl overflow-hidden text-sm shadow-sm">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                            <th className="px-4 py-3 text-left">Sector</th>
                            <th className="px-4 py-3 text-right">Tickets</th>
                            <th className="px-4 py-3 text-right">Sales</th>
                            <th className="px-4 py-3 text-right">Purchase</th>
                            <th className="px-4 py-3 text-right">Profit</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((r) => (
                            <tr key={r.sector} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-semibold">{r.sector}</td>
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
                                <td className="px-4 py-3 text-right font-mono text-slate-500">{formatNPR(r.purchase)}</td>
                                <td className="px-4 py-3 text-right font-mono font-bold text-brand-red">{formatNPR(r.profit)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </RoleGate>
    );
}
