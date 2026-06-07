"use client";

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    type ChartOptions,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels);

export type VerticalBarChartItem = {
    key: string;
    label: string;
    count: number;
};

const BAR_COLORS = [
    "#dc2626",
    "#7c3aed",
    "#2563eb",
    "#059669",
    "#d97706",
    "#db2777",
    "#0891b2",
    "#4f46e5",
    "#65a30d",
    "#ea580c",
    "#0d9488",
    "#9333ea",
    "#e11d48",
    "#6366f1",
];

function shortAirportName(label: string): string {
    const match = label.match(/^(.+)\(/);
    const name = match ? match[1].trim() : label;
    return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

function truncateKey(key: string, max = 16): string {
    return key.length > max ? `${key.slice(0, max - 1)}…` : key;
}

type UsageVerticalBarChartProps = {
    title: string;
    data: VerticalBarChartItem[];
    countLabel?: string;
    limit?: number;
    multiColor?: boolean;
    color?: string;
    /** Airport code + city name on X axis (two lines) */
    nameBelowBars?: boolean;
};

export default function UsageVerticalBarChart({
    title,
    data,
    countLabel = "Count",
    limit = 10,
    multiColor = false,
    color = "#dc2626",
    nameBelowBars = false,
}: UsageVerticalBarChartProps) {
    const items = data.slice(0, limit);
    if (!items.length) return null;

    const barColors = items.map((_, index) =>
        multiColor ? BAR_COLORS[index % BAR_COLORS.length] : color
    );

    const chartData = {
        labels: items.map((item) =>
            nameBelowBars
                ? `${item.key}\n${shortAirportName(item.label)}`
                : truncateKey(item.key, 18)
        ),
        datasets: [
            {
                label: countLabel,
                data: items.map((item) => item.count),
                backgroundColor: barColors.map((c) => `${c}cc`),
                borderColor: barColors,
                borderWidth: 1,
                borderRadius: 6,
                maxBarThickness: 48,
            },
        ],
    };

    const options: ChartOptions<"bar"> = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            datalabels: {
                anchor: "end",
                align: "top",
                offset: 2,
                font: { weight: "bold", size: 10 },
                color: "#475569",
                formatter: (value: number) => (value > 0 ? value : ""),
            },
            tooltip: {
                backgroundColor: "#1e293b",
                titleFont: { size: 11 },
                bodyFont: { size: 11 },
                callbacks: {
                    title: (context) => {
                        const item = items[context[0]?.dataIndex ?? 0];
                        return item ? `${item.label}` : "";
                    },
                    label: (context) => {
                        const item = items[context.dataIndex];
                        return [
                            `${countLabel}: ${context.parsed.y}`,
                            item ? `Code: ${item.key}` : "",
                        ];
                    },
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { precision: 0, font: { size: 10 } },
                grid: { color: "#e2e8f0" },
            },
            x: {
                ticks: {
                    font: {
                        size: nameBelowBars ? 9 : 8,
                        family: nameBelowBars ? "ui-monospace, monospace" : "ui-monospace, monospace",
                    },
                    maxRotation: nameBelowBars ? 0 : 55,
                    minRotation: nameBelowBars ? 0 : 45,
                    autoSkip: false,
                },
                grid: { display: false },
            },
        },
    };

    const chartHeight = nameBelowBars ? 320 : Math.max(300, 240 + items.length * 8);

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">
                {title}
            </h2>
            <div className="w-full" style={{ height: chartHeight }}>
                <Bar data={chartData} options={options} />
            </div>
            {!nameBelowBars && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Route details
                    </p>
                    <ul className="space-y-1.5">
                        {items.map((row, index) => (
                            <li
                                key={row.key}
                                className="flex items-start gap-2.5 text-[11px] leading-snug"
                            >
                                <span
                                    className="mt-1 h-2.5 w-2.5 rounded-sm shrink-0"
                                    style={{
                                        backgroundColor: barColors[index],
                                    }}
                                    aria-hidden
                                />
                                <span className="font-mono font-bold text-slate-800 shrink-0">
                                    {row.key}
                                </span>
                                <span className="text-slate-500 flex-1 min-w-0" title={row.label}>
                                    {row.label}
                                </span>
                                <span className="font-black text-slate-900 tabular-nums shrink-0">
                                    {row.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
