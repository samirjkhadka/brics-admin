"use client";

import { useRouter } from "next/navigation";

export default function FySelect({
    years,
    selectedId,
    basePath,
}: {
    years: { id: string; label: string; status: string }[];
    selectedId?: string;
    basePath: string;
}) {
    const router = useRouter();
    return (
        <select
            value={selectedId || ""}
            onChange={(e) => router.push(`${basePath}?fy=${e.target.value}`)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm font-semibold"
        >
            {years.map((y) => (
                <option key={y.id} value={y.id}>
                    {y.label} ({y.status})
                </option>
            ))}
        </select>
    );
}
