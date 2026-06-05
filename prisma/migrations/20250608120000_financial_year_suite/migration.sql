-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID');
CREATE TYPE "FiscalYearStatus" AS ENUM ('OPEN', 'CLOSED');
ALTER TYPE "Role" ADD VALUE 'VIEWER';

-- CreateTable
CREATE TABLE "FinancialYear" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "bsYearStart" INTEGER NOT NULL,
    "billPrefixYear" INTEGER NOT NULL,
    "startDateAD" TIMESTAMP(3) NOT NULL,
    "endDateAD" TIMESTAMP(3) NOT NULL,
    "startDateBS" TEXT NOT NULL,
    "endDateBS" TEXT NOT NULL,
    "status" "FiscalYearStatus" NOT NULL DEFAULT 'OPEN',
    "nextBillSeq" INTEGER NOT NULL DEFAULT 1,
    "nextReceiptSeq" INTEGER NOT NULL DEFAULT 1,
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialYear_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PartnerFiscalBalance" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "closingBalance" DECIMAL(12,2),
    CONSTRAINT "PartnerFiscalBalance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentReceipt" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "transactionId" TEXT,
    "partnerId" TEXT,
    "partyName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "chequeNo" TEXT,
    "receiptDateAD" TIMESTAMP(3) NOT NULL,
    "receiptDateBS" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaymentReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- AlterTable Transaction
ALTER TABLE "Transaction" ADD COLUMN "billSequence" INTEGER;
ALTER TABLE "Transaction" ADD COLUMN "fiscalYearId" TEXT;
ALTER TABLE "Transaction" ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID';
ALTER TABLE "Transaction" ADD COLUMN "amountReceived" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- Indexes
CREATE UNIQUE INDEX "FinancialYear_label_key" ON "FinancialYear"("label");
CREATE UNIQUE INDEX "PartnerFiscalBalance_partnerId_fiscalYearId_key" ON "PartnerFiscalBalance"("partnerId", "fiscalYearId");
CREATE UNIQUE INDEX "PaymentReceipt_receiptNo_key" ON "PaymentReceipt"("receiptNo");

-- ForeignKeys
ALTER TABLE "PartnerFiscalBalance" ADD CONSTRAINT "PartnerFiscalBalance_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PartnerFiscalBalance" ADD CONSTRAINT "PartnerFiscalBalance_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FinancialYear"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FinancialYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentReceipt" ADD CONSTRAINT "PaymentReceipt_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
