import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!password) {
        throw new Error("SEED_ADMIN_PASSWORD environment variable is required");
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = await prisma.user.upsert({
        where: { email: "admin@brics.com" },
        update: { password: hashedPassword, role: Role.SUPERADMIN },
        create: {
            email: "admin@brics.com",
            mobile: "9800000000",
            password: hashedPassword,
            name: "Super Admin",
            role: Role.SUPERADMIN,
        },
    });

    const bricsAdmin = await prisma.user.upsert({
        where: { email: "admin@bricsworldtravel.com.np" },
        update: { password: hashedPassword, role: Role.ADMIN },
        create: {
            email: "admin@bricsworldtravel.com.np",
            password: hashedPassword,
            name: "Brics Admin",
            role: Role.ADMIN,
        },
    });

    console.log("Upserted users:", { superAdmin: superAdmin.email, bricsAdmin: bricsAdmin.email });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
