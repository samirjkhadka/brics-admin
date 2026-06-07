"use client";

import UsageVerticalBarChart from "@/components/charts/usage-vertical-bar-chart";

export type RouteAnalyticsData = {
    airportUsage: { code: string; label: string; count: number }[];
    routeUsage: { sector: string; label: string; count: number }[];
};

export default function RouteAnalyticsCharts({ data }: { data: RouteAnalyticsData }) {
    return (
        <div className="space-y-6">
            <UsageVerticalBarChart
                title="Most Used Airports"
                data={data.airportUsage.map((row) => ({
                    key: row.code,
                    label: row.label,
                    count: row.count,
                }))}
                countLabel="Appearances"
                limit={12}
                nameBelowBars
            />
            <UsageVerticalBarChart
                title="Most Used Routes"
                data={data.routeUsage.map((row) => ({
                    key: row.sector,
                    label: row.label,
                    count: row.count,
                }))}
                countLabel="Tickets"
                limit={10}
                multiColor
            />
        </div>
    );
}
