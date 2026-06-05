export type Passenger = {
    name: string;
    ticketNo: string;
};

export function parsePassengers(raw: string): Passenger[] {
    if (!raw?.trim()) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map((p) => ({
                name: p.name || "",
                ticketNo: p.ticketNo || "",
            }));
        }
    } catch {
        // fall through to legacy string format
    }

    return [{ name: raw, ticketNo: "" }];
}

export function formatPassengerNames(raw: string): string {
    return parsePassengers(raw)
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ");
}

/** Max passengers listed individually on printed invoices before compacting. */
export const INVOICE_PASSENGER_COMPACT_COUNT = 3;
/** Max combined name length before compacting to "Name x N". */
export const INVOICE_PASSENGER_MAX_CHARS = 72;

export function shouldUseCompactPassengerDisplay(passengers: Passenger[]): boolean {
    if (passengers.length <= 1) return false;
    const joined = passengers
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ");
    return passengers.length > INVOICE_PASSENGER_COMPACT_COUNT || joined.length > INVOICE_PASSENGER_MAX_CHARS;
}

export function formatCompactPassengerDisplay(passengers: Passenger[], fallback = ""): string {
    const first = passengers[0]?.name || fallback;
    const count = Math.max(passengers.length, 1);
    if (count <= 1) return first;
    return `${first} x ${count}`;
}

/** Guest line for Mr./Ms. and compact description on invoices. */
export function formatInvoiceGuestLine(passengers: Passenger[], fallback: string): string {
    if (passengers.length === 0) return fallback;
    if (shouldUseCompactPassengerDisplay(passengers)) {
        return formatCompactPassengerDisplay(passengers, fallback);
    }
    if (passengers.length === 1) return passengers[0].name || fallback;
    return passengers
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ");
}
