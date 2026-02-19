import db from "@/lib/db";
import { ArrowLeft, Download, Plus } from "lucide-react";
import Link from "next/link";
import TransactionsTableClient from "@/components/tickets/transactions-table-client";

export default async function TransactionsListPage() {
    const transactions = await db.transaction.findMany({
        orderBy: { salesDate: "desc" },
    });

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-center px-2">
                <div>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900">Financial Registry</h1>
                    <p className="text-sm text-slate-500 mt-1">Exhaustive view of all travel and financial records</p>
                </div>
                <div className="flex gap-4">
                    <a
                        href="/api/export/excel"
                        className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold transition-all border border-slate-200 flex items-center gap-2 text-sm shadow-sm"
                    >
                        <Download size={16} />
                        Export All (Excel)
                    </a>
                    <Link
                        href="/dashboard/tickets/new"
                        className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-brand-red/20"
                    >
                        <Plus size={18} /> New Entry
                    </Link>
                </div>
            </div>

            <TransactionsTableClient initialData={JSON.parse(JSON.stringify(transactions))} />
        </div>
    );
}
