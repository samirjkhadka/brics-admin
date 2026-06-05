"use client";

import Link from "next/link";
import { Role } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { deleteUser } from "@/app/actions/users";
import { useRouter } from "next/navigation";

type UserRow = {
    id: string;
    name: string | null;
    email: string | null;
    mobile: string | null;
    role: Role;
    createdAt: string;
};

export default function UsersTable({ users }: { users: UserRow[] }) {
    const router = useRouter();

    const handleDelete = async (id: string, email: string | null) => {
        if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;

        const res = await deleteUser(id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error || "Failed to delete user");
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Mobile</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-semibold text-slate-900">{user.name}</td>
                            <td className="px-6 py-4 text-slate-600">{user.email}</td>
                            <td className="px-6 py-4 text-slate-500">{user.mobile || "—"}</td>
                            <td className="px-6 py-4">
                                <span
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                        user.role === Role.SUPERADMIN
                                            ? "bg-purple-100 text-purple-700"
                                            : "bg-blue-100 text-blue-700"
                                    }`}
                                >
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex gap-2 justify-end">
                                    <Link
                                        href={`/dashboard/users/${user.id}/edit`}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                    >
                                        <Pencil size={14} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(user.id, user.email)}
                                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
