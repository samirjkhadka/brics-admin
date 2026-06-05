import { CalendarRange } from "lucide-react";
import { formatNPR } from "@/lib/utils/format-currency";

export default function FiscalYearStatCard({
    fyLabel,
    sales,
    vat,
    profit,
}: {
    fyLabel: string;
    sales: number;
    vat: number;
    profit: number;
}) {
    return (
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm min-w-0 col-span-1 sm:col-span-2 xl:col-span-4">
            <div className="flex items-start gap-3 mb-4">
                <div className="bg-indigo-500/10 text-indigo-600 p-2.5 rounded-xl shrink-0">
                    <CalendarRange size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Running Fiscal Year
                    </p>
                    <p className="text-lg font-black text-slate-900 mt-0.5">FY {fyLabel}</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                    <p className="text-base sm:text-lg font-black text-slate-900 mt-1 tabular-nums break-words">
                        {formatNPR(sales)}
                    </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 min-w-0">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total VAT</p>
                    <p className="text-base sm:text-lg font-black text-emerald-700 mt-1 tabular-nums break-words">
                        {formatNPR(vat)}
                    </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 min-w-0">
                    <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Net Profit</p>
                    <p className="text-base sm:text-lg font-black text-purple-700 mt-1 tabular-nums break-words">
                        {formatNPR(profit)}
                    </p>
                </div>
            </div>
        </div>
    );
}
