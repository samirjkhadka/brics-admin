import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function requireApiRole(allowed: Role[]) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
    });

    if (!dbUser || !allowed.includes(dbUser.role)) {
        return {
            ok: false as const,
            response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        };
    }

    return { ok: true as const, session, role: dbUser.role };
}
