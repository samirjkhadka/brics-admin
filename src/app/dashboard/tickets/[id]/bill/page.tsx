import db from "@/lib/db";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PrintButton from "@/components/tickets/print-button";
import InvoiceDocument from "@/components/tickets/invoice-document";

export default async function BillPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const tx = await db.transaction.findUnique({
        where: { id },
        include: { purchaseLegs: { orderBy: { legIndex: "asc" } } },
    });
    if (!tx) notFound();

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white text-black">
            <div className="max-w-[850px] mx-auto mb-8 flex justify-between items-center print:hidden">
                <Link
                    href="/dashboard/tickets"
                    className="text-slate-500 hover:text-brand-red flex items-center gap-2 text-sm transition-colors font-semibold"
                >
                    <ArrowLeft size={16} /> Back to Registry
                </Link>
                <PrintButton />
            </div>
            <InvoiceDocument tx={tx} variant="proforma" />
        </div>
    );
}
