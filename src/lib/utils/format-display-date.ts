/** Format AD dates as YYYY-MM-DD using the local calendar date. */
export function formatDisplayDate(
    date: Date | string | null | undefined,
    fallback = "—"
): string {
    if (!date) return fallback;
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return fallback;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
