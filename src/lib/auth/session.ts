import { getServerSession } from "next-auth";
import { Role } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export type ActionResult<T = unknown> =
    | { success: true; data?: T }
    | { success: false; error: string };

export async function getSession() {
    return getServerSession(authOptions);
}

export async function requireSession(): Promise<
    | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getSession>>> }
    | { ok: false; error: string }
> {
    const session = await getSession();
    if (!session?.user?.id) {
        return { ok: false, error: "Unauthorized" };
    }

    const dbUser = await db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, role: true },
    });

    if (!dbUser) {
        return { ok: false, error: "Unauthorized" };
    }

    session.user.role = dbUser.role;
    return { ok: true, session };
}

export async function requireRole(
    allowed: Role[]
): Promise<
    | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getSession>>> }
    | { ok: false; error: string }
> {
    const result = await requireSession();
    if (!result.ok) {
        return result;
    }

    if (!allowed.includes(result.session.user.role)) {
        return { ok: false, error: "Forbidden" };
    }

    return result;
}
