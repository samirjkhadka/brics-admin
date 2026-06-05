"use client";

import { useState, useEffect, useRef } from "react";
import { adStringToBs, bsStringToAd } from "@/lib/utils/nepali-calendar.client";
import { attachSajanmDatePicker } from "@/lib/nepali/load-client-picker";

type NepaliDatePickerProps = {
    label: string;
    adValue: string;
    onChange: (ad: string, bs: string) => void;
    required?: boolean;
};

export default function NepaliDatePicker({
    label,
    adValue,
    onChange,
    required,
}: NepaliDatePickerProps) {
    const [bsValue, setBsValue] = useState(adValue ? adStringToBs(adValue) : "");
    const bsInputRef = useRef<HTMLInputElement>(null);
    const destroyPickerRef = useRef<(() => void) | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        const bs = adValue ? adStringToBs(adValue) : "";
        setBsValue(bs);
        if (bsInputRef.current) {
            bsInputRef.current.value = bs;
        }
    }, [adValue]);

    useEffect(() => {
        const input = bsInputRef.current;
        if (!input) return;

        let cancelled = false;

        attachSajanmDatePicker(input, {
            onSelect: (selected) => {
                const bs = selected.value;
                const ad = bsStringToAd(bs);
                setBsValue(bs);
                if (ad) onChangeRef.current(ad, bs);
            },
        }).then((destroy) => {
            if (cancelled) {
                destroy();
                return;
            }
            destroyPickerRef.current = destroy;
        });

        return () => {
            cancelled = true;
            destroyPickerRef.current?.();
            destroyPickerRef.current = null;
        };
    }, []);

    useEffect(() => {
        const input = bsInputRef.current;
        if (!input || document.activeElement === input) return;
        if (bsValue !== input.value) {
            input.value = bsValue;
        }
    }, [bsValue]);

    const handleAdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const ad = e.target.value;
        const bs = ad ? adStringToBs(ad) : "";
        setBsValue(bs);
        if (bsInputRef.current) {
            bsInputRef.current.value = bs;
        }
        onChange(ad, bs);
    };

    const handleBsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const bs = e.target.value;
        setBsValue(bs);
        const ad = bsStringToAd(bs);
        if (ad) onChange(ad, bs);
    };

    return (
        <div className="relative">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                {label} {required && "*"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">AD</span>
                    <input
                        type="date"
                        required={required}
                        value={adValue}
                        onChange={handleAdChange}
                        className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all mt-0.5"
                    />
                </div>
                <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase">BS</span>
                    <input
                        ref={bsInputRef}
                        type="text"
                        placeholder="YYYY-MM-DD"
                        defaultValue={bsValue}
                        onChange={handleBsInputChange}
                        className="w-full bg-slate-50 border-slate-200 rounded-lg px-4 py-2 text-slate-900 text-sm focus:ring-brand-red focus:border-brand-red transition-all mt-0.5"
                    />
                </div>
            </div>
        </div>
    );
}
