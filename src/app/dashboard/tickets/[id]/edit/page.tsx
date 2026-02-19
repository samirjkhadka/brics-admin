import db from "@/lib/db";
import { notFound } from "next/navigation";
import TicketEntryForm from "@/components/tickets/ticket-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function EditTransactionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const tx = await db.transaction.findUnique({
        where: { id: id },
    });

    if (!tx) notFound();

    return (
        <div className="space-y-6">
            <div className="max-w-5xl mx-auto px-4 pt-8">
                <Link
                    href="/dashboard/tickets"
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold transition-colors"
                >
                    <ArrowLeft size={18} />
                    Back to Registry
                </Link>
            </div>
            <TicketEntryForm initialData={tx} />
        </div>
    );
}
