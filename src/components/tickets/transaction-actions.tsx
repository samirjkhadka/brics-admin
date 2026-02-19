"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteTransaction } from "@/app/actions/transactions";
import { useRouter } from "next/navigation";

export function TransactionActions({ id, salesBillNo }: { id: string, salesBillNo: string }) {
    const router = useRouter();

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete transaction #${salesBillNo}? This action cannot be undone.`)) {
            const res = await deleteTransaction(id);
            if (res.success) {
                router.push("/dashboard/tickets");
            } else {
                alert(res.error || "Failed to delete transaction");
            }
        }
    };

    return (
        <div className="flex gap-2">
            <Link
                href={`/dashboard/tickets/${id}/edit`}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl border border-blue-200 font-bold transition-all"
            >
                <Pencil size={18} />
                Edit
            </Link>
            <button
                onClick={handleDelete}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl border border-red-200 font-bold transition-all"
            >
                <Trash2 size={18} />
                Delete
            </button>
        </div>
    );
}
