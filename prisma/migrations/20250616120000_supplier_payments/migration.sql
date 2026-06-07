-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "fiscalYearId" TEXT NOT NULL,
    "partnerId" TEXT,
    "supplierName" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL,
    "chequeNo" TEXT,
    "paymentDateAD" TIMESTAMP(3) NOT NULL,
    "paymentDateBS" TEXT NOT NULL,
    "paymentReference" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierPayment_fiscalYearId_supplierName_idx" ON "SupplierPayment"("fiscalYearId", "supplierName");

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_fiscalYearId_fkey" FOREIGN KEY ("fiscalYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
