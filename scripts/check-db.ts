import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const transactions = await prisma.transaction.findMany({
        take: 10,
        select: {
            id: true,
            salesBillNo: true,
            passengerNames: true,
        },
    });
    console.log(JSON.stringify(transactions, null, 2));
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
