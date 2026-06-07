export const OWN_SALES_LABEL = "Own";

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

/** Sales-only bill with no purchase invoice or purchase amount. */
export function isOwnSalesBill(params: {
    purchaseInvoiceNo?: string | null;
    purchaseAmount?: number | null;
}): boolean {
    const noInvoice = !(params.purchaseInvoiceNo || "").trim();
    const noPurchase = (params.purchaseAmount ?? 0) <= 0;
    return noInvoice && noPurchase;
}

/** True when the ticket's purchasing partner was never set or still has a placeholder value. */
export function isPurchasePartyUnset(purchasePartyName: string | null | undefined): boolean {
    const normalized = (purchasePartyName || "").trim().toLowerCase();
    if (normalized === OWN_SALES_LABEL.toLowerCase()) return false;
    return !normalized || UNSET_PURCHASE_PARTY.has(normalized);
}

export function formatPurchasedFromLabel(params: {
    purchasePartyName?: string | null;
    purchaseInvoiceNo?: string | null;
    purchaseAmount?: number | null;
}): string {
    if (isOwnSalesBill(params)) return OWN_SALES_LABEL;
    const name = (params.purchasePartyName || "").trim();
    if (isPurchasePartyUnset(name)) return "No supplier";
    return name;
}
