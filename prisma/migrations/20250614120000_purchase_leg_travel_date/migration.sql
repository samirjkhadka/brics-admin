-- Travel date per purchase leg (may differ by sector/route)
ALTER TABLE "PurchaseLeg" ADD COLUMN "travelDate" TIMESTAMP(3);
ALTER TABLE "PurchaseLeg" ADD COLUMN "travelDateBS" TEXT;

-- Backfill from parent transaction
UPDATE "PurchaseLeg" pl
SET
    "travelDate" = t."travelDate",
    "travelDateBS" = CASE
        WHEN t."travelDate" IS NOT NULL THEN NULL
        ELSE NULL
    END
FROM "Transaction" t
WHERE pl."transactionId" = t.id
  AND t."travelDate" IS NOT NULL;
