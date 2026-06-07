import db from "@/lib/db";
import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import { Plane } from "lucide-react";
import { Suspense } from "react";
import SectorAnalyticsClient from "@/components/reports/sector-analytics-client";
import MonthlyTrendsChart from "@/components/dashboard/monthly-trends-chart";
import { getFiscalYearMonthlyTrends } from "@/lib/dashboard/trends";
import { getActiveFinancialYear } from "@/lib/fiscal-year/service";
import {
    countAirportUsage,
    countRouteUsage,
    formatSectorRouteCompact,
} from "@/lib/data/airports";

export default async function SectorAnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ fy?: string; months?: string }>;
}) {
    const params = await searchParams;
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
        .map(([sector, d]) => ({
            sector,
            sectorLabel: formatSectorRouteCompact(sector),
            ...d,
            profit: d.sales - d.purchase,
        }))
        .sort((a, b) => b.profit - a.profit);

    const sectors = transactions.map((tx) => tx.sector);
    const airportUsage = countAirportUsage(sectors);
    const routeUsage = countRouteUsage(sectors);
    const totalProfit = rows.reduce((s, r) => s + r.profit, 0);

    const [activeFy, fiscalYears] = await Promise.all([
        getActiveFinancialYear(),
        db.financialYear.findMany({ orderBy: { startDateAD: "desc" } }),
    ]);

    const chartFy =
        fiscalYears.find((fy) => fy.id === params.fy) ||
        activeFy ||
        fiscalYears[0];

    const selectedMonthIndices = params.months
        ? params.months
              .split(",")
              .map((m) => parseInt(m, 10))
              .filter((n) => !isNaN(n) && n >= 0 && n < 12)
        : [];

    const chartData = chartFy
        ? await getFiscalYearMonthlyTrends(chartFy.startDateAD, chartFy.endDateAD)
        : [];

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-red/10 rounded-xl">
                        <Plane className="text-brand-red" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Sector Analytics</h1>
                        <p className="text-sm text-slate-500">
                            Routes with airport names; click ticket count to view in All Transactions
                        </p>
                    </div>
                </div>

                {chartFy && (
                    <Suspense
                        fallback={
                            <div className="h-80 bg-white border border-slate-200 rounded-2xl animate-pulse" />
                        }
                    >
                        <MonthlyTrendsChart
                            chartData={chartData}
                            fiscalYears={fiscalYears.map((fy) => ({
                                id: fy.id,
                                label: fy.label,
                                status: fy.status,
                            }))}
                            selectedFyId={chartFy.id}
                            selectedMonthIndices={selectedMonthIndices}
                            basePath="/dashboard/reports/sectors"
                        />
                    </Suspense>
                )}

                <SectorAnalyticsClient
                    rows={rows}
                    airportUsage={airportUsage}
                    routeUsage={routeUsage}
                    totalTickets={transactions.length}
                    totalProfit={totalProfit}
                />
            </div>
        </RoleGate>
    );
}
