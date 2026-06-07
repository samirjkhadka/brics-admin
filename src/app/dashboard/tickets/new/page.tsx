import db from "@/lib/db";
import { PartnerType, Role } from "@prisma/client";
import TicketEntryForm from "@/components/tickets/ticket-form";
import BulkUploadForm from "@/components/tickets/bulk-upload-form";
import { getNextSalesBillNo } from "@/lib/utils/sales-bill-no";
import { adStringToBs } from "@/lib/utils/nepali-calendar";
import { enforcePageRole, RoleGate } from "@/components/auth/role-gate";

export default async function NewTicketPage() {
    await enforcePageRole([Role.SUPERADMIN, Role.ADMIN]);

    const today = new Date().toISOString().split("T")[0];
    const defaultInitialData = {
        salesDate: today,
        salesDateBS: adStringToBs(today),
    };

    const [partners, nextSalesBillNo] = await Promise.all([
        db.partner.findMany({
        where: { isActive: true },
            orderBy: { name: "asc" },
            select: { id: true, name: true, type: true, vatNo: true, contactNo: true, bankName: true },
        }),
        getNextSalesBillNo(),
    ]);

    const customerPartners = partners.filter((p) => p.type === PartnerType.CUSTOMER);
    const supplierPartners = partners.filter((p) => p.type === PartnerType.SUPPLIER);

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN]}>
            <div className="py-6 space-y-8 max-w-5xl mx-auto px-4">
                <BulkUploadForm />
                <div className="border-t border-slate-200 pt-8">
                    <TicketEntryForm
                        nextSalesBillNo={nextSalesBillNo}
                        initialData={defaultInitialData}
                        customerPartners={JSON.parse(JSON.stringify(customerPartners))}
                        supplierPartners={JSON.parse(JSON.stringify(supplierPartners))}
                    />
                </div>
            </div>
        </RoleGate>
    );
}
