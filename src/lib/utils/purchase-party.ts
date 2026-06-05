const UNSET_PURCHASE_PARTY = new Set([
    "",
    "unspecified",
    "legacy import",
    "not specified",
    "-",
    "n/a",
    "na",
    "tbd",
]);

/** True when the ticket's purchasing partner was never set or still has a placeholder value. */
export function isPurchasePartyUnset(purchasePartyName: string | null | undefined): boolean {
    const normalized = (purchasePartyName || "").trim().toLowerCase();
    return !normalized || UNSET_PURCHASE_PARTY.has(normalized);
}
