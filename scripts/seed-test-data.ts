import { PrismaClient, PaymentMethod } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const tx = await prisma.transaction.create({
        data: {
            passengerNames: JSON.stringify([{ name: "John Doe", ticketNo: "" }, { name: "Jane Smith", ticketNo: "" }]),
            partyName: "ABC Corp",
            sector: "KTM-DXB",
            salesBillNo: `BILL-${Date.now()}`,
            salesDate: new Date(),
            salesDateBS: "2080-11-06",
            purchaseInvoiceNo: "PUR-101",
            purchaseAmount: 50000,
            salesAmount: 73500,
            exemptAmount: 3500,
            taxableAmount: 61946.9,
            vatAmount: 8053.1,
            receivedStatus: PaymentMethod.BANK,
            travelDate: new Date(),
            contactNo: "9876543210",
            partyVatNo: "600000000",
        },
    });
    console.log("Created sample transaction:", tx.id);
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
