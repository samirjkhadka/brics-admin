import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import UserForm from "@/components/users/user-form";

export default function NewUserPage() {
    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="space-y-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900">Create User</h1>
                <UserForm />
            </div>
        </RoleGate>
    );
}
