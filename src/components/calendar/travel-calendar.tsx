"use client";

import Link from "next/link";
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isToday,
    addMonths,
    subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plane, MapPin } from "lucide-react";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import { useRouter } from "next/navigation";
import {
    originAirportFromSector,
    sectorColorClasses,
} from "@/lib/calendar/airport-colors";
import { findAirport } from "@/lib/data/airports";

type Flight = {
    id: string;
    salesBillNo: string;
    passengerNames: string;
    sector: string;
    partyName: string;
    travelDate: string;
};

function ticketsForDateUrl(dateKey: string) {
    return `/dashboard/tickets?travelDate=${encodeURIComponent(dateKey)}`;
}

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
    const originAirports = new Set<string>();
    for (const f of flights) {
        const key = format(new Date(f.travelDate), "yyyy-MM-dd");
        const list = byDay.get(key) || [];
        list.push(f);
        byDay.set(key, list);
        const origin = originAirportFromSector(f.sector);
        if (origin) originAirports.add(origin);
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

            {originAirports.size > 0 && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="font-bold uppercase tracking-wider text-slate-500">
                        Origin airport
                    </span>
                    {[...originAirports].sort().map((code) => {
                        const colors = sectorColorClasses(code);
                        const airport = findAirport(code);
                        return (
                            <span
                                key={code}
                                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${colors.bg} ${colors.border} ${colors.text}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                                {airport ? `${airport.city} (${code})` : code}
                            </span>
                        );
                    })}
                    <span className="text-slate-400">· Click a date to view all tickets</span>
                </div>
            )}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                    {weekDays.map((d) => (
                        <div
                            key={d}
                            className="px-2 py-3 text-center text-[10px] font-black uppercase text-slate-500 tracking-wider"
                        >
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {padDays.map((i) => (
                        <div
                            key={`pad-${i}`}
                            className="min-h-[100px] bg-slate-50/50 border-b border-r border-slate-100"
                        />
                    ))}
                    {days.map((day) => {
                        const key = format(day, "yyyy-MM-dd");
                        const dayFlights = byDay.get(key) || [];
                        const today = isToday(day);
                        const ticketsUrl = ticketsForDateUrl(key);

                        return (
                            <div
                                key={key}
                                className={`min-h-[100px] border-b border-r border-slate-100 p-2 transition-colors ${
                                    today ? "bg-brand-red/5" : "hover:bg-slate-50/80"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <Link
                                        href={ticketsUrl}
                                        title={`View all tickets travelling on ${key}`}
                                        className={`text-sm font-bold hover:underline ${
                                            today
                                                ? "bg-brand-red text-white w-7 h-7 rounded-full flex items-center justify-center hover:text-white"
                                                : "text-slate-700 hover:text-brand-red"
                                        }`}
                                    >
                                        {format(day, "d")}
                                    </Link>
                                    {dayFlights.length > 0 && (
                                        <Link
                                            href={ticketsUrl}
                                            className="text-[10px] font-black bg-brand-red/10 text-brand-red px-1.5 py-0.5 rounded-full hover:bg-brand-red/20"
                                            title={`View ${dayFlights.length} ticket(s) on ${key}`}
                                        >
                                            {dayFlights.length}
                                        </Link>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    {dayFlights.slice(0, 2).map((tx) => {
                                        const colors = sectorColorClasses(tx.sector);
                                        return (
                                            <Link
                                                key={tx.id}
                                                href={`/dashboard/tickets/${tx.id}`}
                                                className={`block text-[10px] leading-tight p-1 rounded border hover:shadow-sm transition-all ${colors.bg} ${colors.border} hover:opacity-90`}
                                                title={`${tx.sector} — ${tx.partyName}`}
                                            >
                                                <span className={`font-mono font-bold ${colors.text}`}>
                                                    #{tx.salesBillNo}
                                                </span>
                                                <span className={`block truncate ${colors.text}`}>
                                                    {tx.sector}
                                                </span>
                                            </Link>
                                        );
                                    })}
                                    {dayFlights.length > 2 && (
                                        <Link
                                            href={ticketsUrl}
                                            className="text-[9px] text-brand-red font-semibold pl-1 hover:underline"
                                        >
                                            +{dayFlights.length - 2} more
                                        </Link>
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
                        {flights.map((tx) => {
                            const colors = sectorColorClasses(tx.sector);
                            const dateKey = format(new Date(tx.travelDate), "yyyy-MM-dd");
                            return (
                                <div
                                    key={tx.id}
                                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 hover:border-brand-red/20 hover:bg-slate-50/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <Link
                                            href={ticketsForDateUrl(dateKey)}
                                            className={`text-center shrink-0 w-24 px-2 py-1 rounded-lg border ${colors.bg} ${colors.border}`}
                                            title={`View all tickets on ${dateKey}`}
                                        >
                                            <p className={`text-[10px] font-black uppercase ${colors.text}`}>
                                                {dateKey}
                                            </p>
                                        </Link>
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
                                            <p className={`text-xs font-medium ${colors.text}`}>
                                                {tx.sector} · {tx.partyName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <Link
                                            href={ticketsForDateUrl(dateKey)}
                                            className="text-xs font-bold text-sky-600 hover:underline"
                                        >
                                            View date
                                        </Link>
                                        <Link
                                            href={`/dashboard/tickets?sector=${encodeURIComponent(tx.sector)}`}
                                            className="text-xs font-bold text-brand-red hover:underline"
                                        >
                                            View sector
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
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
