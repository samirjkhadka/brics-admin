import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import PartnerForm from "@/components/partners/partner-form";

export default function NewPartnerPage() {
    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="space-y-6 max-w-5xl mx-auto">
                <h1 className="text-3xl font-black text-slate-900">Add Partner</h1>
                <PartnerForm />
            </div>
        </RoleGate>
    );
}
