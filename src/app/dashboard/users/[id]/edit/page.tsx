import { notFound } from "next/navigation";
import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import UserForm from "@/components/users/user-form";
import ResetPasswordForm from "@/components/users/reset-password-form";

export default async function EditUserPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await db.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
        },
    });

    if (!user) notFound();

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="space-y-8 max-w-5xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900">Edit User</h1>
                <UserForm
                    initialData={{
                        id: user.id,
                        name: user.name || "",
                        email: user.email || "",
                        mobile: user.mobile || "",
                        role: user.role,
                    }}
                />
                <ResetPasswordForm userId={user.id} />
            </div>
        </RoleGate>
    );
}
