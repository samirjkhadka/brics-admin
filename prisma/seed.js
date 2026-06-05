const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password) {
        throw new Error("SEED_ADMIN_PASSWORD environment variable is required to run seed");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
        where: { email: "admin@brics.com" },
        update: { password: hashedPassword, role: "SUPERADMIN" },
        create: {
            name: "Super Admin",
            mobile: "9800000000",
            email: "admin@brics.com",
            password: hashedPassword,
            role: "SUPERADMIN",
        },
    });

    const bricsAdmin = await prisma.user.upsert({
        where: { email: "admin@bricsworldtravel.com.np" },
        update: { password: hashedPassword, role: "ADMIN" },
        create: {
            name: "Brics Admin",
            email: "admin@bricsworldtravel.com.np",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    const admin23 = await prisma.user.upsert({
        where: { email: "admin@23" },
        update: { password: hashedPassword, role: "ADMIN" },
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
