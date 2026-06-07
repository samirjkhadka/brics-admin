-- Per-leg exempt amount for invoice line items (SINGLE billing)
ALTER TABLE "PurchaseLeg" ADD COLUMN "exemptAmount" DECIMAL(12, 2) NOT NULL DEFAULT 0;
