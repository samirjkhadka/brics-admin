"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
        >
            <Printer size={18} /> Print Invoice
        </button>
    );
}
