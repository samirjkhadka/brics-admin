-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK', 'CASH', 'QR');

-- AlterTable User: convert role string to enum
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role" USING (
  CASE
    WHEN UPPER("role") = 'SUPERADMIN' THEN 'SUPERADMIN'::"Role"
    ELSE 'ADMIN'::"Role"
  END
);
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable Transaction: convert money fields to Decimal
ALTER TABLE "Transaction" ALTER COLUMN "purchaseAmount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Transaction" ALTER COLUMN "salesAmount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Transaction" ALTER COLUMN "exemptAmount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Transaction" ALTER COLUMN "taxableAmount" SET DATA TYPE DECIMAL(12,2);
ALTER TABLE "Transaction" ALTER COLUMN "vatAmount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable Transaction: convert receivedStatus to enum
ALTER TABLE "Transaction" ALTER COLUMN "receivedStatus" TYPE "PaymentMethod" USING ("receivedStatus"::"PaymentMethod");

-- CreateTable Partner
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactNo" TEXT,
    "email" TEXT,
    "vatNo" TEXT,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolderName" TEXT,
    "branch" TEXT,
    "address" TEXT,
    "remarks" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable NotificationLog
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partner_name_key" ON "Partner"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationLog_transactionId_alertType_key" ON "NotificationLog"("transactionId", "alertType");

-- AddForeignKey
ALTER TABLE "NotificationLog" ADD CONSTRAINT "NotificationLog_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
