"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Plus, X, ArrowRight } from "lucide-react";
import {
    AIRPORTS,
    formatAirportOption,
    findAirport,
    parseSectorCodes,
    serializeSectorCodes,
    formatSectorRoute,
} from "@/lib/data/airports";

function AirportSearchSelect({
    value,
    onChange,
    required,
}: {
    value: string;
    onChange: (code: string) => void;
    required?: boolean;
}) {
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selected = value ? findAirport(value) : undefined;

    useEffect(() => {
        if (selected) setQuery(formatAirportOption(selected));
        else if (value) setQuery(value);
        else setQuery("");
    }, [value, selected]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return AIRPORTS.slice(0, 60);
        return AIRPORTS.filter((a) => {
            const label = formatAirportOption(a).toLowerCase();
            return (
                label.includes(q) ||
                a.code.toLowerCase().includes(q) ||
                a.name.toLowerCase().includes(q) ||
                a.country.toLowerCase().includes(q)
            );
        }).slice(0, 80);
    }, [query]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={containerRef} className="relative flex-1 min-w-[160px]">
            <input
                type="text"
                required={required && !value}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    setOpen(true);
                    const upper = e.target.value.trim().toUpperCase();
                    if (/^[A-Z]{3}$/.test(upper)) onChange(upper);
                }}
                onFocus={() => setOpen(true)}
                placeholder="Search city or code..."
                className="w-full bg-slate-50 border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
            />
            {open && filtered.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full max-h-52 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
                    {filtered.map((a) => (
                        <li key={a.code}>
                            <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-slate-50"
                                onClick={() => {
                                    onChange(a.code);
                                    setQuery(formatAirportOption(a));
                                    setOpen(false);
                                }}
                            >
                                <span className="font-medium">{formatAirportOption(a)}</span>
                                {a.country && (
                                    <span className="text-slate-400 text-xs ml-1">{a.country}</span>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

type RouteBuilderProps = {
    value: string;
    onChange: (sector: string) => void;
    required?: boolean;
};

export default function RouteBuilder({ value, onChange, required }: RouteBuilderProps) {
    const [segments, setSegments] = useState<string[]>(() => {
        const codes = parseSectorCodes(value);
        return codes.length ? codes : [""];
    });

    const updateSegments = (next: string[]) => {
        setSegments(next);
        onChange(serializeSectorCodes(next));
    };

    const handleSegmentChange = (index: number, code: string) => {
        const next = [...segments];
        next[index] = code;
        updateSegments(next);
    };

    const addSegment = () => {
        if (segments.length >= 8) return;
        updateSegments([...segments, ""]);
    };

    const removeSegment = (index: number) => {
        if (segments.length <= 1) return;
        updateSegments(segments.filter((_, i) => i !== index));
    };

    const routePreview = value ? formatSectorRoute(value) : "";

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
                {segments.map((code, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ArrowRight size={14} className="text-slate-300 shrink-0" />}
                        <AirportSearchSelect
                            value={code}
                            onChange={(c) => handleSegmentChange(index, c)}
                            required={required && index === 0}
                        />
                        {segments.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeSegment(index)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                title="Remove stop"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                ))}
                {segments.length < 8 && (
                    <button
                        type="button"
                        onClick={addSegment}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-brand-red hover:bg-brand-red/5 rounded-lg border border-dashed border-brand-red/30 transition-colors shrink-0"
                    >
                        <Plus size={14} /> Add stop
                    </button>
                )}
            </div>
            {routePreview && (
                <p className="text-[10px] text-slate-500 font-mono">
                    Route: <span className="text-slate-700 font-semibold">{routePreview}</span>
                    <span className="text-slate-400 ml-2">({value})</span>
                </p>
            )}
        </div>
    );
}
