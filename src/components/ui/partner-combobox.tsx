"use client";

import { useState, useEffect } from "react";

export type PartnerOption = {
    id: string;
    name: string;
    vatNo?: string | null;
    contactNo?: string | null;
    bankName?: string | null;
};

export type PartnerComboboxExtraOption = {
    id: string;
    name: string;
    groupLabel?: string;
};

type PartnerComboboxProps = {
    label: string;
    value: string;
    partners: PartnerOption[];
    extraOptions?: PartnerComboboxExtraOption[];
    onChange: (name: string, partner?: PartnerOption) => void;
    required?: boolean;
};

const CUSTOM_VALUE = "__custom__";

export default function PartnerCombobox({
    label,
    value,
    partners,
    extraOptions = [],
    onChange,
    required,
}: PartnerComboboxProps) {
    const matched = partners.find((p) => p.name === value);
    const matchedExtra = extraOptions.find((o) => o.name === value);
    const [mode, setMode] = useState<"partner" | "custom">(
        value && !matched && !matchedExtra ? "custom" : "partner"
    );
    const [selectedId, setSelectedId] = useState(matched?.id || matchedExtra?.id || "");

    useEffect(() => {
        const m = partners.find((p) => p.name === value);
        const extra = extraOptions.find((o) => o.name === value);
        if (m) {
            setMode("partner");
            setSelectedId(m.id);
        } else if (extra) {
            setMode("partner");
            setSelectedId(extra.id);
        } else if (value) {
            setMode("custom");
            setSelectedId(CUSTOM_VALUE);
        }
    }, [value, partners, extraOptions]);

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedId(id);
        if (id === CUSTOM_VALUE) {
            setMode("custom");
            onChange("");
        } else {
            setMode("partner");
            const partner = partners.find((p) => p.id === id);
            if (partner) {
                onChange(partner.name, partner);
                return;
            }
            const extra = extraOptions.find((o) => o.id === id);
            if (extra) onChange(extra.name);
        }
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                {label} {required && "*"}
            </label>
            <select
                value={mode === "custom" ? CUSTOM_VALUE : selectedId}
                onChange={handleSelectChange}
                className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all mb-2"
            >
                <option value="">Select partner...</option>
                {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                ))}
                {extraOptions.length > 0 && (
                    <optgroup label="Passengers">
                        {extraOptions.map((o) => (
                            <option key={o.id} value={o.id}>
                                {o.name}
                            </option>
                        ))}
                    </optgroup>
                )}
                <option value={CUSTOM_VALUE}>Custom name...</option>
            </select>
            {mode === "custom" && (
                <input
                    type="text"
                    required={required}
                    value={value}
                    onChange={handleCustomChange}
                    placeholder="Enter name"
                    className="w-full bg-white border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all"
                />
            )}
        </div>
    );
}
