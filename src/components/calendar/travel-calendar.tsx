"use client";

import Link from "next/link";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    addMonths,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plane, MapPin } from "lucide-react";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import { useRouter } from "next/navigation";

type Flight = {
    id: string;
    salesBillNo: string;
    passengerNames: string;
    sector: string;
    partyName: string;
    travelDate: string;
};

export default function TravelCalendar({
    year,
    month,
    flights,
}: {
    year: number;
    month: number;
    flights: Flight[];
}) {
    const router = useRouter();
    const monthStart = startOfMonth(new Date(year, month, 1));
    const monthEnd = endOfMonth(monthStart);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startPad = monthStart.getDay();
    const padDays = Array.from({ length: startPad }, (_, i) => i);

    const byDay = new Map<string, Flight[]>();
    for (const f of flights) {
        const key = format(new Date(f.travelDate), "yyyy-MM-dd");
        const list = byDay.get(key) || [];
        list.push(f);
        byDay.set(key, list);
    }

    const navigate = (y: number, m: number) => {
        router.push(`/dashboard/calendar?year=${y}&month=${m}`);
    };

    const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            const prev = subMonths(monthStart, 1);
                            navigate(prev.getFullYear(), prev.getMonth());
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-white hover:border-brand-red/30 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-2xl font-black text-slate-900 min-w-[200px] text-center">
                        {format(monthStart, "MMMM yyyy")}
                    </h2>
                    <button
                        type="button"
                        onClick={() => {
                            const next = addMonths(monthStart, 1);
                            navigate(next.getFullYear(), next.getMonth());
                        }}
                        className="p-2 rounded-xl border border-slate-200 hover:bg-white hover:border-brand-red/30 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Plane size={16} className="text-brand-red" />
                    <span className="font-bold">{flights.length}</span> flights this month
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {weekDays.map((d) => (
                        <div key={d} className="px-2 py-3 text-center text-[10px] font-black uppercase text-slate-500 tracking-wider">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {padDays.map((i) => (
                        <div key={`pad-${i}`} className="min-h-[100px] bg-slate-50/50 border-b border-r border-slate-100" />
                    ))}
                    {days.map((day) => {
                        const key = format(day, "yyyy-MM-dd");
                        const dayFlights = byDay.get(key) || [];
                        const today = isToday(day);

                        return (
                            <div
                                key={key}
                                className={`min-h-[100px] border-b border-r border-slate-100 p-2 transition-colors ${
                                    today ? "bg-brand-red/5" : "hover:bg-slate-50/80"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={`text-sm font-bold ${
                                            today
                                                ? "bg-brand-red text-white w-7 h-7 rounded-full flex items-center justify-center"
                                                : "text-slate-700"
                                        }`}
                                    >
                                        {format(day, "d")}
                                    </span>
                                    {dayFlights.length > 0 && (
                                        <span className="text-[10px] font-black bg-brand-red/10 text-brand-red px-1.5 py-0.5 rounded-full">
                                            {dayFlights.length}
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {dayFlights.slice(0, 2).map((tx) => (
                                        <Link
                                            key={tx.id}
                                            href={`/dashboard/tickets/${tx.id}`}
                                            className="block text-[10px] leading-tight p-1 rounded bg-white border border-slate-200 hover:border-brand-red/40 hover:shadow-sm transition-all"
                                            title={`${tx.sector} — ${tx.partyName}`}
                                        >
                                            <span className="font-mono font-bold text-brand-red">#{tx.salesBillNo}</span>
                                            <span className="block text-slate-600 truncate">{tx.sector}</span>
                                        </Link>
                                    ))}
                                    {dayFlights.length > 2 && (
                                        <span className="text-[9px] text-slate-400 font-semibold pl-1">
                                            +{dayFlights.length - 2} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {flights.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-black uppercase text-slate-500 tracking-wider mb-4 flex items-center gap-2">
                        <MapPin size={16} /> Upcoming & This Month
                    </h3>
                    <div className="space-y-3">
                        {flights.map((tx) => (
                            <div
                                key={tx.id}
                                className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-red/20 hover:bg-slate-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="text-center shrink-0 w-14">
                                        <p className="text-xs font-bold text-slate-400 uppercase">
                                            {format(new Date(tx.travelDate), "MMM")}
                                        </p>
                                        <p className="text-2xl font-black text-brand-red leading-none">
                                            {format(new Date(tx.travelDate), "d")}
                                        </p>
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/dashboard/tickets/${tx.id}`}
                                            className="font-mono font-bold text-slate-900 hover:text-brand-red"
                                        >
                                            #{tx.salesBillNo}
                                        </Link>
                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                            {formatPassengerNames(tx.passengerNames)}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {tx.sector} · {tx.partyName}
                                        </p>
                                    </div>
                                </div>
                                <Link
                                    href={`/dashboard/tickets?sector=${encodeURIComponent(tx.sector)}`}
                                    className="text-xs font-bold text-brand-red hover:underline shrink-0"
                                >
                                    View sector
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {flights.length === 0 && (
                <div className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-2xl">
                    <Plane className="mx-auto text-slate-300 mb-3" size={40} />
                    <p className="text-slate-500 font-semibold">No travel dates this month</p>
                </div>
            )}
        </div>
    );
}
