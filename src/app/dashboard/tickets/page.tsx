import db from "@/lib/db";
import { ArrowLeft, Download, Plus } from "lucide-react";
import Link from "next/link";
import TransactionsTableClient from "@/components/tickets/transactions-table-client";
import { adToBs } from "@/lib/utils/nepali-calendar";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export default async function TransactionsListPage({
    searchParams,
}: {
    searchParams: Promise<{ sector?: string; purchaseFrom?: string; search?: string }>;
}) {
    const { sector, purchaseFrom, search } = await searchParams;
    const session = await getSession();
    const canEdit = session?.user?.role === Role.SUPERADMIN || session?.user?.role === Role.ADMIN;

    const transactions = await db.transaction.findMany({
        orderBy: [{ billSequence: "desc" }, { salesBillNo: "desc" }],
        include: { refunds: true },
    });

    const serialized = transactions.map((tx) => {
        const priorCustomerRefund = tx.refunds.reduce(
            (s, r) => s + Number(r.customerRefundAmount),
            0
        );
        const priorSupplierCredit = tx.refunds.reduce(
            (s, r) => s + Number(r.supplierCreditAmount),
            0
        );
        const priorCashRefund = tx.refunds.reduce(
            (s, r) => s + Number(r.customerCashAmount),
            0
        );
        return {
            ...tx,
            purchaseAmount: Number(tx.purchaseAmount),
            salesAmount: Number(tx.salesAmount),
            exemptAmount: Number(tx.exemptAmount),
            taxableAmount: Number(tx.taxableAmount),
            vatAmount: Number(tx.vatAmount),
            amountReceived: Number(tx.amountReceived),
            travelDateBS: tx.travelDate ? adToBs(tx.travelDate) : null,
            priorCustomerRefund,
            priorSupplierCredit,
            priorCashRefund,
            refunds: undefined,
        };
    });

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
            <div className="flex justify-between items-center px-2">
                <div>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors mb-2 text-sm"
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
                    {canEdit && (
                        <Link
                            href="/dashboard/tickets/new"
                            className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2 rounded-lg font-bold transition-all text-sm flex items-center gap-2 shadow-lg shadow-brand-red/20"
                        >
                            <Plus size={18} /> New Entry
                        </Link>
                    )}
                </div>
            </div>

            <TransactionsTableClient
                initialData={JSON.parse(JSON.stringify(serialized))}
                canEdit={canEdit}
                initialSectorFilter={sector ? decodeURIComponent(sector) : ""}
                initialPurchaseFromFilter={purchaseFrom ? decodeURIComponent(purchaseFrom) : ""}
                initialSearchTerm={search ? decodeURIComponent(search) : ""}
            />
        </div>
    );
}
