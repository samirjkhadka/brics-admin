import Link from "next/link";
import { Plus } from "lucide-react";
import { enforcePageRole, RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import UsersTable from "@/components/users/users-table";

export default async function UsersPage() {
    await enforcePageRole([Role.SUPERADMIN]);

    const users = await db.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            role: true,
            createdAt: true,
        },
    });

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">User Management</h1>
                        <p className="text-sm text-slate-500 mt-1">Manage admin accounts and roles</p>
                    </div>
                    <Link
                        href="/dashboard/users/new"
                        className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"
                    >
                        <Plus size={18} /> Add User
                    </Link>
                </div>
                <UsersTable users={JSON.parse(JSON.stringify(users))} />
            </div>
        </RoleGate>
    );
}
