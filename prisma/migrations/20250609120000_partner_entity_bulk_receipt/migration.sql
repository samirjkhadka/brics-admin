-- CreateEnum
CREATE TYPE "PartnerEntityType" AS ENUM ('BUSINESS', 'INDIVIDUAL');

-- AlterTable
ALTER TABLE "Partner" ADD COLUMN "entityType" "PartnerEntityType" NOT NULL DEFAULT 'BUSINESS';

-- CreateTable
CREATE TABLE "PaymentReceiptAllocation" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PaymentReceiptAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentReceiptAllocation_receiptId_transactionId_key" ON "PaymentReceiptAllocation"("receiptId", "transactionId");

-- AddForeignKey
ALTER TABLE "PaymentReceiptAllocation" ADD CONSTRAINT "PaymentReceiptAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "PaymentReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceiptAllocation" ADD CONSTRAINT "PaymentReceiptAllocation_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
