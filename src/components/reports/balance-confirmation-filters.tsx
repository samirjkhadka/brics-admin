"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function BalanceConfirmationFilters({
    years,
    selectedFyId,
    parties,
    selectedParty,
}: {
    years: { id: string; label: string; status: string }[];
    selectedFyId?: string;
    parties: string[];
    selectedParty?: string;
}) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const navigate = (fy: string, party: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (fy) params.set("fy", fy);
        else params.delete("fy");
        if (party) params.set("party", party);
        else params.delete("party");
        router.push(`/dashboard/reports/balance-confirmation?${params.toString()}`);
    };

    return (
        <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                Financial Year
                <select
                    value={selectedFyId || ""}
                    onChange={(e) => navigate(e.target.value, selectedParty || "")}
                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-800"
                >
                    {years.map((y) => (
                        <option key={y.id} value={y.id}>
                            {y.label} ({y.status})
                        </option>
                    ))}
                </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                Party
                <select
                    value={selectedParty || ""}
                    onChange={(e) => navigate(selectedFyId || "", e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold text-slate-800 min-w-[200px]"
                >
                    <option value="">All parties</option>
                    {parties.map((name) => (
                        <option key={name} value={name}>
                            {name}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
