import db from "@/lib/db";
import { formatDisplayDate } from "@/lib/utils/format-display-date";
import { notFound } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/tickets/print-button";
import ReceiptDocument from "@/components/reports/receipt-document";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const receipt =
        (await db.paymentReceipt.findFirst({
            where: { transactionId: id },
            include: { transaction: true },
        })) ||
        (await db.paymentReceipt.findFirst({
            where: { allocations: { some: { transactionId: id } } },
            include: {
                transaction: true,
                allocations: { where: { transactionId: id }, include: { transaction: true } },
            },
        }));

    if (!receipt) notFound();

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-[700px] mx-auto mb-6 flex justify-between print:hidden">
                <Link href={`/dashboard/tickets/${id}`} className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold text-sm">
                    <ArrowLeft size={16} /> Back to Details
                </Link>
                <div className="flex gap-3">
                    <Link
                        href="/dashboard/reports/receipt/sample"
                        target="_blank"
                        className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm"
                    >
                        View Sample
                    </Link>
                    <a
                        href={`/api/export/receipt/${id}`}
                        className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg font-bold text-sm"
                    >
                        <Download size={16} /> DOCX
                    </a>
                    <PrintButton />
                </div>
            </div>

            <ReceiptDocument
                data={{
                    receiptNo: receipt.receiptNo,
                    receiptDateAD: formatDisplayDate(receipt.receiptDateAD),
                    receiptDateBS: receipt.receiptDateBS,
                    partyName: receipt.partyName,
                    amount: Number(receipt.amount),
                    paymentMethod: receipt.paymentMethod,
                    chequeNo: receipt.chequeNo,
                    travelDate: formatDisplayDate(receipt.transaction?.travelDate, ""),
                    sector: receipt.transaction?.sector || null,
                    billNo: receipt.transaction?.salesBillNo || null,
                }}
            />
        </div>
    );
}
