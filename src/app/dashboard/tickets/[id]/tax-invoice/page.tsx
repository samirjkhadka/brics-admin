import db from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/tickets/print-button";
import InvoiceDocument from "@/components/tickets/invoice-document";
import { PaymentStatus } from "@prisma/client";

export default async function TaxInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tx = await db.transaction.findUnique({
        where: { id },
        include: { purchaseLegs: { orderBy: { legIndex: "asc" } } },
    });
    if (!tx) notFound();

    const isPaid = tx.paymentStatus === PaymentStatus.PAID;

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white text-black">
            <div className="max-w-[850px] mx-auto mb-6 flex justify-between print:hidden">
                <Link
                    href={`/dashboard/tickets/${id}`}
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold text-sm"
                >
                    <ArrowLeft size={16} /> Back
                </Link>
                <PrintButton />
            </div>

            {!isPaid && (
                <div className="max-w-[800px] mx-auto mb-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm print:hidden">
                    This bill is not fully paid. Tax invoice is intended for completed payments.
                </div>
            )}

            <InvoiceDocument tx={tx} variant="tax" />
        </div>
    );
}
