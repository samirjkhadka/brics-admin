import airportsData from "./airports.json";

export type Airport = {
    code: string;
    city: string;
    name: string;
    country: string;
};

/** IATA airports sourced from https://github.com/mwgg/Airports (public domain/MIT). */
export const AIRPORTS: Airport[] = airportsData as Airport[];

const byCode = new Map(AIRPORTS.map((a) => [a.code, a]));

export function formatAirportOption(a: Airport): string {
    const place = a.city || a.name;
    return `${place} (${a.code})`;
}

export function findAirport(code: string): Airport | undefined {
    return byCode.get(code.trim().toUpperCase());
}

export function parseSectorCodes(sector: string): string[] {
    if (!sector.trim()) return [];
    return sector
        .split("-")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
}

export function serializeSectorCodes(codes: string[]): string {
    return codes
        .map((c) => c.trim().toUpperCase())
        .filter(Boolean)
        .join("-");
}

export function formatSectorRoute(sector: string): string {
    const codes = parseSectorCodes(sector);
    if (!codes.length) return "";
    return codes
        .map((code) => {
            const airport = findAirport(code);
            return airport ? formatAirportOption(airport) : code;
        })
        .join(" → ");
}

/** Compact route label: DELHI(DEL)-BAHRAIN(BAH)-LARNACA(LCA) */
export function formatAirportSegment(code: string): string {
    const airport = findAirport(code);
    if (!airport) return code;
    const place = (airport.city || airport.name).toUpperCase();
    return `${place}(${airport.code})`;
}

export function formatSectorRouteCompact(sector: string): string {
    const codes = parseSectorCodes(sector);
    if (!codes.length) return sector.trim();
    return codes.map(formatAirportSegment).join("-");
}

export function countAirportUsage(sectors: string[]): { code: string; label: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const sector of sectors) {
        for (const code of parseSectorCodes(sector)) {
            counts.set(code, (counts.get(code) || 0) + 1);
        }
    }
    return Array.from(counts.entries())
        .map(([code, count]) => ({
            code,
            label: formatAirportSegment(code),
            count,
        }))
        .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

export function countRouteUsage(
    sectors: string[]
): { sector: string; label: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const sector of sectors) {
        const key = sector.trim();
        if (!key) continue;
        counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([sector, count]) => ({
            sector,
            label: formatSectorRouteCompact(sector),
            count,
        }))
        .sort((a, b) => b.count - a.count || a.sector.localeCompare(b.sector));
}
