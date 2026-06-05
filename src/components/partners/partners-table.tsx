"use client";

import Link from "next/link";
import { Pencil, Ban, BookOpen } from "lucide-react";
import { deactivatePartner } from "@/app/actions/partners";
import { useRouter } from "next/navigation";

type PartnerRow = {
    id: string;
    name: string;
    type: string;
    entityType: string;
    contactPerson: string | null;
    contactNo: string | null;
    bankName: string;
    accountNumber: string;
    vatNo: string | null;
    isActive: boolean;
};

export default function PartnersTable({ partners }: { partners: PartnerRow[] }) {
    const router = useRouter();

    const handleDeactivate = async (id: string, name: string) => {
        if (!confirm(`Deactivate partner "${name}"?`)) return;

        const res = await deactivatePartner(id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error || "Failed to deactivate partner");
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Entity</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Bank</th>
                        <th className="px-6 py-4">Account</th>
                        <th className="px-6 py-4">VAT</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {partners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-semibold text-slate-900">
                                {partner.name}
                                {partner.bankName === "Pending" && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-black uppercase">
                                        Incomplete
                                    </span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <span
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                        partner.type === "SUPPLIER"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-purple-100 text-purple-700"
                                    }`}
                                >
                                    {partner.type === "SUPPLIER" ? "Supplier" : "Customer"}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <span className="text-xs font-semibold text-slate-600 capitalize">
                                    {partner.entityType?.toLowerCase() || "business"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                                <div>{partner.contactPerson || "—"}</div>
                                <div className="text-xs text-slate-400">{partner.contactNo}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{partner.bankName}</td>
                            <td className="px-6 py-4 font-mono text-slate-700">{partner.accountNumber}</td>
                            <td className="px-6 py-4 text-slate-500">{partner.vatNo || "—"}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${partner.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                    {partner.isActive ? "Active" : "Inactive"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex gap-2 justify-end">
                                    {partner.type === "CUSTOMER" && (
                                        <Link
                                            href={`/dashboard/partners/${partner.id}/ledger`}
                                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                                            title="FY Ledger"
                                        >
                                            <BookOpen size={14} />
                                        </Link>
                                    )}
                                    <Link href={`/dashboard/partners/${partner.id}/edit`} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                        <Pencil size={14} />
                                    </Link>
                                    {partner.isActive && (
                                        <button onClick={() => handleDeactivate(partner.id, partner.name)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                            <Ban size={14} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
