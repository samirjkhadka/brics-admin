"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PartnerEntityType, PartnerType } from "@prisma/client";
import { X, Check } from "lucide-react";
import { createPartner, updatePartner } from "@/app/actions/partners";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

type PartnerFormData = {
    id?: string;
    name: string;
    type: PartnerType;
    entityType: PartnerEntityType;
    contactPerson: string;
    contactNo: string;
    email: string;
    vatNo: string;
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    branch: string;
    address: string;
    remarks: string;
    isActive: boolean;
};

export default function PartnerForm({ initialData }: { initialData?: PartnerFormData }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        type: initialData?.type || PartnerType.CUSTOMER,
        entityType: initialData?.entityType || PartnerEntityType.BUSINESS,
        contactPerson: initialData?.contactPerson || "",
        contactNo: initialData?.contactNo || "",
        email: initialData?.email || "",
        vatNo: initialData?.vatNo || "",
        bankName: initialData?.bankName === "Pending" ? "" : initialData?.bankName || "",
        accountNumber: initialData?.accountNumber === "Pending" ? "" : initialData?.accountNumber || "",
        accountHolderName: initialData?.accountHolderName || "",
        branch: initialData?.branch || "",
        address: initialData?.address || "",
        remarks: initialData?.remarks || "",
        isActive: initialData?.isActive ?? true,
    });

    const bankRequired = formData.type === PartnerType.SUPPLIER;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const res = initialData?.id
            ? await updatePartner(initialData.id, formData)
            : await createPartner(formData);

        if (res.success) {
            router.push("/dashboard/partners");
            router.refresh();
        } else {
            setError(res.error || "Unknown error");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-8 space-y-6 max-w-2xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type *</label>
                    <select
                        name="type"
                        required
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    >
                        <option value={PartnerType.CUSTOMER}>Customer (sell to)</option>
                        <option value={PartnerType.SUPPLIER}>Supplier (buy from)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Business / Individual *</label>
                    <select
                        name="entityType"
                        required
                        value={formData.entityType}
                        onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                    >
                        <option value={PartnerEntityType.BUSINESS}>Business</option>
                        <option value={PartnerEntityType.INDIVIDUAL}>Individual</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Partner Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                    <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contact No</label>
                    <input type="text" name="contactNo" value={formData.contactNo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">VAT No</label>
                    <input type="text" name="vatNo" value={formData.vatNo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Bank Details</h3>
                <p className="text-xs text-slate-500 mb-4">
                    {formData.type === PartnerType.CUSTOMER
                        ? "Optional for customers — can be added later."
                        : "Required for suppliers."}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Bank Name {bankRequired && "*"}
                        </label>
                        <input
                            type="text"
                            name="bankName"
                            required={bankRequired}
                            value={formData.bankName}
                            onChange={handleChange}
                            placeholder={bankRequired ? "" : "Optional"}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                            Account Number {bankRequired && "*"}
                        </label>
                        <input
                            type="text"
                            name="accountNumber"
                            required={bankRequired}
                            value={formData.accountNumber}
                            onChange={handleChange}
                            placeholder={bankRequired ? "" : "Optional"}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Account Holder</label>
                        <input type="text" name="accountHolderName" value={formData.accountHolderName} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Branch</label>
                        <input type="text" name="branch" value={formData.branch} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Remarks</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm" />
                </div>
                {initialData?.id && (
                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} id="isActive" />
                        <label htmlFor="isActive" className="text-sm font-semibold text-slate-700">Active</label>
                    </div>
                )}
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

            <div className="flex gap-3">
                <ButtonWithIcon
                    type="button"
                    icon={X}
                    onClick={() => router.back()}
                    className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold"
                >
                    Cancel
                </ButtonWithIcon>
                <ButtonWithIcon
                    type="submit"
                    icon={Check}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg bg-brand-red text-white font-bold disabled:opacity-50"
                >
                    {loading ? "Saving..." : initialData?.id ? "Update Partner" : "Create Partner"}
                </ButtonWithIcon>
            </div>
        </form>
    );
}
