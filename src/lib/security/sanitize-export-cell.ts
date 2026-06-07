/** Prevent spreadsheet formula injection when opening exports in Excel. */
export function sanitizeSpreadsheetCell(value: unknown): string | number {
    if (value === null || value === undefined) return "";
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) return `'${text}`;
    return text;
}

export function sanitizeSpreadsheetRow<T extends Record<string, unknown>>(
    row: T
): Record<string, string | number> {
    const out: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(row)) {
        out[key] = sanitizeSpreadsheetCell(value);
    }
    return out;
}
