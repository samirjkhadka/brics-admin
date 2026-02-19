const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("admin@23", 10);

    // 1. Original Super Admin
    const admin = await prisma.user.upsert({
        where: { email: "admin@brics.com" },
        update: { password: hashedPassword },
        create: {
            name: "Super Admin",
            mobile: "9800000000",
            email: "admin@brics.com",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    // 2. New Company Admin
    const bricsAdmin = await prisma.user.upsert({
        where: { email: "admin@bricsworldtravel.com.np" },
        update: { password: hashedPassword },
        create: {
            name: "Brics Admin",
            email: "admin@bricsworldtravel.com.np",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    // 3. Admin@23 User (Ambiguous, adding as user to be safe)
    const admin23 = await prisma.user.upsert({
        where: { email: "admin@23" },
        update: { password: hashedPassword },
        create: {
            name: "Admin 23",
            email: "admin@23",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log({ admin, bricsAdmin, admin23 });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
