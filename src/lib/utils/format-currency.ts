type AmountInput = number | string | { toNumber(): number };

function toNumber(amount: AmountInput): number {
    if (typeof amount === "object" && amount !== null && "toNumber" in amount) {
        return amount.toNumber();
    }
    const value = typeof amount === "string" ? parseFloat(amount) : amount;
    return value;
}

/**
 * Formats a number as NPR currency with two decimal places and thousands separators.
 * Example: 1000 -> NPR 1,000.00
 */
export function formatNPR(amount: AmountInput): string {
    const value = toNumber(amount);

    if (isNaN(value)) {
        return "NPR 0.00";
    }

    return new Intl.NumberFormat("en-NP", {
        style: "currency",
        currency: "NPR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formats a number with two decimal places and thousands separators, but without the currency prefix.
 * Example: 1000 -> 1,000.00
 */
export function formatNumber(amount: AmountInput): string {
    const value = toNumber(amount);

    if (isNaN(value)) {
        return "0.00";
    }

    return new Intl.NumberFormat("en-NP", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
