-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "isVoided" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Transaction" ADD COLUMN "voidReason" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "voidedAt" TIMESTAMP(3);
