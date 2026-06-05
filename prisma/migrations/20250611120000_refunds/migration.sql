-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('CUSTOMER_ONLY', 'CUSTOMER_AND_SUPPLIER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('NONE', 'PARTIAL', 'FULL');

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "refundStatus" "RefundStatus" NOT NULL DEFAULT 'NONE';

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "refundType" "RefundType" NOT NULL,
    "customerRefundAmount" DECIMAL(12,2) NOT NULL,
    "customerCashAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "supplierCreditAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "supplierCreditNoteNo" TEXT,
    "refundDateAD" TIMESTAMP(3) NOT NULL,
    "refundDateBS" TEXT NOT NULL,
    "paymentMethod" "PaymentMethod",
    "paymentReference" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
