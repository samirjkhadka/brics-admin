
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = "admin@23";
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Add new admin user
    const newUser = await prisma.user.upsert({
        where: { email: "admin@bricsworldtravel.com.np" },
        update: { password: hashedPassword },
        create: {
            email: "admin@bricsworldtravel.com.np",
            password: hashedPassword,
            name: "Brics Admin",
            role: "ADMIN",
        }
    });
    console.log("Upserted new admin:", newUser.email);

    // 2. Update current admin user from seed (admin@brics.com)
    const currentAdmin = await prisma.user.upsert({
        where: { email: "admin@brics.com" },
        update: { password: hashedPassword },
        create: {
            email: "admin@brics.com",
            mobile: "9800000000",
            password: hashedPassword,
            name: "Super Admin",
            role: "ADMIN",
        }
    });
    console.log("Upserted current admin password:", currentAdmin.email);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
