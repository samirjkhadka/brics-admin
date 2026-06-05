-- AlterTable
ALTER TABLE "FinancialYear" ADD COLUMN "billNoFormat" TEXT NOT NULL DEFAULT '{year}-{seq:3}';
ALTER TABLE "FinancialYear" ADD COLUMN "receiptNoFormat" TEXT NOT NULL DEFAULT 'R-{year}-{seq:3}';

-- Reset active FY bill sequence to 001 for fresh FY numbering cutover
UPDATE "FinancialYear"
SET "nextBillSeq" = 1, "nextReceiptSeq" = 1
WHERE "status" = 'OPEN';
