import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
    name,
    value,
    trend,
    icon: Icon,
    color,
    bg,
}: {
    name: string;
    value: string;
    trend?: number;
    icon: LucideIcon;
    color: string;
    bg: string;
}) {
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
            </div>
        </div>
    );
}
