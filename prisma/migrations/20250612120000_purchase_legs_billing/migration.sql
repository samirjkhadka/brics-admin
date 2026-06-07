-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('SINGLE', 'SPLIT');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "billingMode" "BillingMode" NOT NULL DEFAULT 'SINGLE';
ALTER TABLE "Transaction" ADD COLUMN "bookingGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_bookingGroupId_idx" ON "Transaction"("bookingGroupId");

-- CreateTable
CREATE TABLE "PurchaseLeg" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "legIndex" INTEGER NOT NULL,
    "purchaseInvoiceNo" TEXT NOT NULL,
    "purchasePartyName" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "purchaseDateBS" TEXT,
    "purchaseAmount" DECIMAL(12,2) NOT NULL,
    "lineSalesAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseLeg_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseLeg_purchaseInvoiceNo_key" ON "PurchaseLeg"("purchaseInvoiceNo");
CREATE INDEX "PurchaseLeg_transactionId_idx" ON "PurchaseLeg"("transactionId");

-- AddForeignKey
ALTER TABLE "PurchaseLeg" ADD CONSTRAINT "PurchaseLeg_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one purchase leg per existing transaction (dedupe legacy duplicate invoice nos)
INSERT INTO "PurchaseLeg" (
    "id",
    "transactionId",
    "legIndex",
    "purchaseInvoiceNo",
    "purchasePartyName",
    "sector",
    "purchaseDate",
    "purchaseDateBS",
    "purchaseAmount",
    "lineSalesAmount",
    "updatedAt"
)
SELECT
    gen_random_uuid()::text,
    ranked."id",
    1,
    CASE
        WHEN ranked."row_num" = 1 THEN ranked."purchaseInvoiceNo"
        ELSE ranked."purchaseInvoiceNo" || '-' || ranked."salesBillNo"
    END,
    ranked."purchasePartyName",
    ranked."sector",
    ranked."purchaseDate",
    ranked."purchaseDateBS",
    ranked."purchaseAmount",
    ranked."salesAmount",
    CURRENT_TIMESTAMP
FROM (
    SELECT
        t.*,
        ROW_NUMBER() OVER (
            PARTITION BY t."purchaseInvoiceNo"
            ORDER BY t."createdAt" ASC, t."id" ASC
        ) AS "row_num"
    FROM "Transaction" t
) ranked;
