import { BillingMode } from "@prisma/client";
import { calculateTax } from "@/lib/utils/calculations";

export type PurchaseLegInput = {
    purchaseInvoiceNo: string;
    purchasePartyName: string;
    sector: string;
    purchaseDate?: string | null;
    purchaseDateBS?: string | null;
    travelDate?: string | null;
    travelDateBS?: string | null;
    purchaseAmount: number;
    lineSalesAmount?: number;
    salesAmount?: number;
    exemptAmount?: number;
    ticketNo?: string | null;
};

export function joinSectors(legs: { sector: string }[]): string {
    const codes: string[] = [];
    for (const leg of legs) {
        const legCodes = leg.sector
            .split("-")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
        for (const code of legCodes) {
            if (codes.length === 0 || codes[codes.length - 1] !== code) {
                codes.push(code);
            }
        }
    }
    return codes.join("-");
}

export function summarizePurchaseInvoices(legs: { purchaseInvoiceNo: string }[]): string {
    if (legs.length === 0) return "";
    if (legs.length === 1) return legs[0].purchaseInvoiceNo.trim();
    return `${legs[0].purchaseInvoiceNo.trim()} + ${legs.length - 1} more`;
}

export type SalesOnlyTrip = {
    sector: string;
    travelDate?: string | null;
    travelDateBS?: string | null;
};

export function allocateLineSalesAmounts(
    legs: { purchaseAmount: number; lineSalesAmount?: number }[],
    totalSales: number
): number[] {
    if (legs.length === 0) return [];

    const hasExplicit = legs.every((l) => (l.lineSalesAmount ?? 0) > 0);
    if (hasExplicit) return legs.map((l) => l.lineSalesAmount!);

    const purchaseTotal = legs.reduce((s, l) => s + l.purchaseAmount, 0);
    if (purchaseTotal <= 0) {
        const each = totalSales / legs.length;
        return legs.map(() => Math.round(each * 100) / 100);
    }

    const raw = legs.map((l) => (l.purchaseAmount / purchaseTotal) * totalSales);
    const rounded = raw.map((v) => Math.round(v * 100) / 100);
    const diff = Math.round((totalSales - rounded.reduce((s, v) => s + v, 0)) * 100) / 100;
    if (rounded.length > 0) rounded[rounded.length - 1] += diff;
    return rounded;
}

export function splitProportionally(total: number, weights: number[]): number[] {
    if (weights.length === 0) return [];
    const weightSum = weights.reduce((s, w) => s + w, 0);
    if (weightSum <= 0) {
        const each = total / weights.length;
        return weights.map(() => Math.round(each * 100) / 100);
    }
    const raw = weights.map((w) => (w / weightSum) * total);
    const rounded = raw.map((v) => Math.round(v * 100) / 100);
    const diff = Math.round((total - rounded.reduce((s, v) => s + v, 0)) * 100) / 100;
    if (rounded.length > 0) rounded[rounded.length - 1] += diff;
    return rounded;
}

export function earliestPurchaseDate(legs: { purchaseDate?: string | null }[]): Date | null {
    const dates = legs
        .map((l) => (l.purchaseDate ? new Date(l.purchaseDate) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
    if (!dates.length) return null;
    return new Date(Math.min(...dates.map((d) => d.getTime())));
}

export function earliestTravelDate(legs: { travelDate?: string | null }[]): Date | null {
    const dates = legs
        .map((l) => (l.travelDate ? new Date(l.travelDate) : null))
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()));
    if (!dates.length) return null;
    return new Date(Math.min(...dates.map((d) => d.getTime())));
}

export function legTravelFields(leg: {
    travelDate?: string | null;
    travelDateBS?: string | null;
}) {
    return {
        travelDate: leg.travelDate ? new Date(leg.travelDate) : null,
        travelDateBS: leg.travelDate ? leg.travelDateBS || null : null,
    };
}

export type InvoiceLineItem = {
    sector: string;
    lineSalesAmount: number;
    taxableAmount: number;
    exemptAmount: number;
    vatAmount: number;
};

export function buildInvoiceLineItems(
    legs: { sector: string; lineSalesAmount: number; exemptAmount?: number }[],
    totalExempt: number = 0
): InvoiceLineItem[] {
    if (!legs.length) return [];

    const lineSales = legs.map((l) => l.lineSalesAmount);
    const hasPerLegExempt = legs.some((l) => l.exemptAmount != null && l.exemptAmount > 0);
    const allocatedExempt = hasPerLegExempt
        ? legs.map((l) => l.exemptAmount ?? 0)
        : splitProportionally(totalExempt, lineSales);

    return legs.map((leg, i) => {
        const sales = lineSales[i];
        const exempt = allocatedExempt[i];
        const { taxableAmount, vatAmount } = calculateTax(sales, exempt);
        return {
            sector: leg.sector,
            lineSalesAmount: sales,
            exemptAmount: exempt,
            taxableAmount,
            vatAmount,
        };
    });
}

export function isSplitBooking(mode: BillingMode, bookingGroupId: string | null | undefined): boolean {
    return mode === BillingMode.SPLIT && Boolean(bookingGroupId);
}
