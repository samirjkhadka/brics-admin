-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('SUPPLIER', 'CUSTOMER');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'CHEQUE';

-- AlterTable Partner: add type, change unique constraint
ALTER TABLE "Partner" ADD COLUMN "type" "PartnerType" NOT NULL DEFAULT 'CUSTOMER';
DROP INDEX IF EXISTS "Partner_name_key";
CREATE UNIQUE INDEX "Partner_name_type_key" ON "Partner"("name", "type");

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN "purchasePartyName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Transaction" ADD COLUMN "chequeNo" TEXT;
