import { parseSectorCodes } from "@/lib/data/airports";

const PALETTE = [
    { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-900", dot: "bg-sky-500" },
    { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900", dot: "bg-emerald-500" },
    { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-900", dot: "bg-violet-500" },
    { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-900", dot: "bg-amber-500" },
    { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-900", dot: "bg-rose-500" },
    { bg: "bg-cyan-100", border: "border-cyan-300", text: "text-cyan-900", dot: "bg-cyan-500" },
    { bg: "bg-indigo-100", border: "border-indigo-300", text: "text-indigo-900", dot: "bg-indigo-500" },
    { bg: "bg-orange-100", border: "border-orange-300", text: "text-orange-900", dot: "bg-orange-500" },
];

export type AirportColorClasses = {
    bg: string;
    border: string;
    text: string;
    dot: string;
};

const NEUTRAL: AirportColorClasses = {
    bg: "bg-slate-100",
    border: "border-slate-200",
    text: "text-slate-700",
    dot: "bg-slate-400",
};

export function originAirportFromSector(sector: string): string {
    return parseSectorCodes(sector)[0] || "";
}

function hashCode(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

export function airportColorClasses(airportCode: string): AirportColorClasses {
    const code = airportCode.trim().toUpperCase();
    if (!code) return NEUTRAL;
    return PALETTE[hashCode(code) % PALETTE.length];
}

export function sectorColorClasses(sector: string): AirportColorClasses {
    return airportColorClasses(originAirportFromSector(sector));
}
