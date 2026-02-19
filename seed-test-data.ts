
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tx = await prisma.transaction.create({
        data: {
            passengerNames: "John Doe, Jane Smith",
            partyName: "ABC Corp",
            sector: "KTM-DXB",
            salesBillNo: "BILL-001",
            salesDate: new Date(),
            salesDateBS: "2080-11-06",
            purchaseInvoiceNo: "PUR-101",
            purchaseAmount: 50000,
            salesAmount: 73500,
            exemptAmount: 3500,
            taxableAmount: 61946.90, // ((73500-3500)*100)/113
            vatAmount: 8053.10,     // 61946.90 * 0.13
            receivedStatus: "BANK",
            travelDate: new Date(),
            contactNo: "9876543210",
            partyVatNo: "600000000",
        }
    })
    console.log("Created sample transaction:", tx.id)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
