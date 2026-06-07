import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
    name,
    value,
    trend,
    periodLabel,
    compareMonthLabel,
    compareValue,
    icon: Icon,
    color,
    bg,
}: {
    name: string;
    value: string;
    trend?: number;
    /** Month the headline value covers, e.g. "June 2026". */
    periodLabel?: string;
    /** Prior month used for the trend comparison, e.g. "May 2026". */
    compareMonthLabel?: string;
    /** Formatted amount from the prior month. */
    compareValue?: string;
    icon: LucideIcon;
    color: string;
    bg: string;
}) {
    const trendDirection =
        trend === undefined ? null : trend >= 0 ? "up" : "down";

    return (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm min-w-0 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2 min-w-0">
                <div className={`${bg} ${color} p-2.5 rounded-xl shrink-0`}>
                    <Icon size={20} />
                </div>
                {trend !== undefined && (
                    <div
                        className={`flex items-center text-[10px] font-bold gap-0.5 shrink-0 ${
                            trend >= 0 ? "text-emerald-500" : "text-red-500"
                        }`}
                    >
                        {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {Math.abs(trend).toFixed(1)}%
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">
                    {name}
                </p>
                <p
                    className="text-base sm:text-lg xl:text-xl font-black text-slate-900 mt-1 tabular-nums leading-tight break-words"
                    title={value}
                >
                    {value}
                </p>
                {periodLabel && (
                    <p className="text-[11px] font-semibold text-slate-500 mt-1">{periodLabel}</p>
                )}
                {trend !== undefined && compareMonthLabel && compareValue !== undefined && (
                    <p
                        className={`text-[10px] font-medium mt-1 leading-snug ${
                            trendDirection === "down" ? "text-red-600/90" : "text-emerald-600/90"
                        }`}
                    >
                        {Math.abs(trend).toFixed(1)}% {trendDirection} from {compareValue} ({compareMonthLabel})
                    </p>
                )}
            </div>
        </div>
    );
}
