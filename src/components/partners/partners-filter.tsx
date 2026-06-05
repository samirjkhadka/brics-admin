"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
    { key: "", label: "All" },
    { key: "SUPPLIER", label: "Suppliers" },
    { key: "CUSTOMER", label: "Customers" },
    { key: "INCOMPLETE", label: "Incomplete" },
] as const;

export default function PartnersFilter() {
    const searchParams = useSearchParams();
    const current = searchParams.get("type") || "";

    return (
        <div className="flex gap-2 flex-wrap">
            {TABS.map((tab) => {
                const href = tab.key ? `/dashboard/partners?type=${tab.key}` : "/dashboard/partners";
                const active = current === tab.key;
                return (
                    <Link
                        key={tab.label}
                        href={href}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                            active
                                ? "bg-brand-red text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
