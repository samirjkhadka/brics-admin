-- Drop unique constraint on purchase invoice numbers (same supplier invoice may cover multiple sales bills)
DROP INDEX IF EXISTS "PurchaseLeg_purchaseInvoiceNo_key";

CREATE INDEX "PurchaseLeg_purchaseInvoiceNo_idx" ON "PurchaseLeg"("purchaseInvoiceNo");
