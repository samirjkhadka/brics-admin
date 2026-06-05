"use client";

import { useState } from "react";
import { Receipt, Check } from "lucide-react";
import { issueReceiptForTransaction } from "@/app/actions/receipts";
import { useRouter } from "next/navigation";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
import Link from "next/link";

export function IssueReceiptButton({
    transactionId,
    hasReceipt,
    receiptNo,
}: {
    transactionId: string;
    hasReceipt: boolean;
    receiptNo?: string | null;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    if (hasReceipt && receiptNo) {
        return (
            <Link
                href={`/dashboard/tickets/${transactionId}/receipt`}
                className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-200 font-bold text-sm"
            >
                <Receipt size={18} />
                Receipt {receiptNo}
            </Link>
        );
    }

    const handleIssue = async () => {
        setLoading(true);
        const res = await issueReceiptForTransaction(transactionId);
        if (res.success) router.refresh();
        else alert(res.error || "Failed to issue receipt");
        setLoading(false);
    };

    return (
        <ButtonWithIcon
            type="button"
            icon={Check}
            onClick={handleIssue}
            disabled={loading}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-sm"
        >
            {loading ? "Issuing..." : "Issue Receipt"}
        </ButtonWithIcon>
    );
}
