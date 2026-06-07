import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";

/** Call at the top of a page before loading restricted data (uses DB role, not stale JWT). */
export async function enforcePageRole(allowed: Role[]) {
    const result = await requireRole(allowed);
    if (!result.ok) {
        redirect("/dashboard?error=forbidden");
    }
    return result.session;
}

export async function RoleGate({
    allowed,
    children,
}: {
    allowed: Role[];
    children: React.ReactNode;
}) {
    await enforcePageRole(allowed);
    return <>{children}</>;
}
