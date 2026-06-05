"use client";

import { useState } from "react";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { createUser, updateUser } from "@/app/actions/users";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

type UserFormData = {
    id?: string;
    name: string;
    email: string;
    mobile: string;
    role: Role;
};

export default function UserForm({ initialData }: { initialData?: UserFormData }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        email: initialData?.email || "",
        mobile: initialData?.mobile || "",
        role: initialData?.role || Role.ADMIN,
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = initialData?.id
            ? await updateUser(initialData.id, {
                  name: formData.name,
                  email: formData.email,
                  mobile: formData.mobile || null,
                  role: formData.role,
              })
            : await createUser(formData);

        if (res.success) {
            router.push("/dashboard/users");
            router.refresh();
        } else {
            setError(res.error || "Unknown error");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 max-w-xl shadow-sm">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name *</label>
                <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email *</label>
                <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mobile</label>
                <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role *</label>
                <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                >
                    <option value={Role.SUPERADMIN}>SUPERADMIN</option>
                    <option value={Role.ADMIN}>ADMIN</option>
                    <option value={Role.VIEWER}>VIEWER (read-only)</option>
                </select>
            </div>
            {!initialData?.id && (
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password *</label>
                    <input
                        type="password"
                        name="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    />
                </div>
            )}

            {error && (
                <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>
            )}

            <div className="flex gap-3">
                <ButtonWithIcon
                    type="button"
                    icon={X}
                    onClick={() => router.back()}
                    className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                    Cancel
                </ButtonWithIcon>
                <ButtonWithIcon
                    type="submit"
                    icon={Check}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg bg-brand-red text-white font-bold disabled:opacity-50"
                >
                    {loading ? "Saving..." : initialData?.id ? "Update User" : "Create User"}
                </ButtonWithIcon>
            </div>
        </form>
    );
}
