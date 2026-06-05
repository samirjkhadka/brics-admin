import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export async function RoleGate({
    allowed,
    children,
}: {
    allowed: Role[];
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session?.user?.role || !allowed.includes(session.user.role)) {
        redirect("/dashboard?error=forbidden");
    }

    return <>{children}</>;
}
