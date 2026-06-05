/** Tokens: {year} = BS bill prefix year, {seq:N} = zero-padded sequence (N digits, default 3). */

export const DEFAULT_BILL_FORMAT = "{year}-{seq:3}";
export const DEFAULT_RECEIPT_FORMAT = "R-{year}-{seq:3}";

export const BILL_FORMAT_PRESETS = [
    { label: "2083-001 (BS year + 3-digit)", value: "{year}-{seq:3}" },
    { label: "2083-0001 (BS year + 4-digit)", value: "{year}-{seq:4}" },
    { label: "001 only (3-digit)", value: "{seq:3}" },
    { label: "BRICS-2083-001", value: "BRICS-{year}-{seq:3}" },
] as const;

export const RECEIPT_FORMAT_PRESETS = [
    { label: "R-2083-001", value: "R-{year}-{seq:3}" },
    { label: "R-2083-0001", value: "R-{year}-{seq:4}" },
    { label: "REC-001", value: "REC-{seq:3}" },
] as const;

export function formatFromTemplate(
    template: string,
    year: number,
    sequence: number
): string {
    const safe = template || DEFAULT_BILL_FORMAT;
    return safe.replace(/\{seq:(\d+)\}/g, (_, digits: string) => {
        const pad = parseInt(digits, 10) || 3;
        return String(sequence).padStart(pad, "0");
    }).replace(/\{seq\}/g, String(sequence)).replace(/\{year\}/g, String(year));
}

export function previewBillFormat(
    template: string,
    year: number,
    sequence: number
): string {
    return formatFromTemplate(template, year, sequence);
}

export function validateBillFormat(template: string): string | null {
    if (!template.trim()) return "Format cannot be empty";
    if (!template.includes("{seq") && !template.includes("{seq:")) {
        return "Format must include {seq} or {seq:N} for the sequence number";
    }
    return null;
}
