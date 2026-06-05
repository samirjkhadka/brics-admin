import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import SamplePageShell from "@/components/reports/sample-page-shell";
import ReceiptDocument from "@/components/reports/receipt-document";
import { SAMPLE_RECEIPT } from "@/lib/reports/sample-data";
import Link from "next/link";
import { Download } from "lucide-react";

export default function ReceiptSamplePage() {
    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <SamplePageShell title="Reports" backHref="/dashboard/reports/balance-confirmation">
                <div className="max-w-[700px] mx-auto mb-4 flex justify-end print:hidden">
                    <a
                        href="/api/templates/receipt/sample"
                        className="inline-flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg font-bold text-sm"
                    >
                        <Download size={16} /> Download Template (DOCX)
                    </a>
                </div>
                <ReceiptDocument
                    isSample
                    data={{
                        receiptNo: SAMPLE_RECEIPT.receiptNo,
                        receiptDateAD: SAMPLE_RECEIPT.receiptDateAD,
                        receiptDateBS: SAMPLE_RECEIPT.receiptDateBS,
                        partyName: SAMPLE_RECEIPT.partyName,
                        amount: SAMPLE_RECEIPT.amount,
                        paymentMethod: SAMPLE_RECEIPT.paymentMethod,
                        chequeNo: SAMPLE_RECEIPT.chequeNo,
                        bankName: SAMPLE_RECEIPT.bankName,
                        travelDate: SAMPLE_RECEIPT.travelDate,
                        sector: SAMPLE_RECEIPT.sector,
                        billNo: SAMPLE_RECEIPT.billNo,
                    }}
                />
                <p className="text-center text-xs text-slate-400 mt-4 print:hidden">
                    Layout matches{" "}
                    <Link href="/api/templates/receipt/sample" className="text-brand-red hover:underline">
                        REC_BRICS WORLD TRAVEL AND TOURS PVT LTD.docx
                    </Link>
                </p>
            </SamplePageShell>
        </RoleGate>
    );
}
