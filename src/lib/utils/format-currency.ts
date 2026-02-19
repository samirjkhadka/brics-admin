/**
 * Formats a number as NPR currency with two decimal places and thousands separators.
 * Example: 1000 -> NPR 1,000.00
 */
export function formatNPR(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(value)) {
        return "NPR 0.00";
    }

    return new Intl.NumberFormat('en-NP', {
        style: 'currency',
        currency: 'NPR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formats a number with two decimal places and thousands separators, but without the currency prefix.
 * Example: 1000 -> 1,000.00
 */
export function formatNumber(amount: number | string): string {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(value)) {
        return "0.00";
    }

    return new Intl.NumberFormat('en-NP', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}
