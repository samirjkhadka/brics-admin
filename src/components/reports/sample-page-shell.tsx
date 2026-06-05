import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PrintButton from "@/components/tickets/print-button";

export default function SamplePageShell({
    title,
    backHref,
    children,
}: {
    title: string;
    backHref: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
                <Link
                    href={backHref}
                    className="flex items-center gap-2 text-slate-500 hover:text-brand-red font-semibold text-sm"
                >
                    <ArrowLeft size={16} /> Back to {title}
                </Link>
                <PrintButton />
            </div>
            <div className="max-w-4xl mx-auto mb-4 print:hidden">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-lg text-sm font-semibold">
                    This is a sample preview with demo data — not linked to live records.
                </div>
            </div>
            {children}
        </div>
    );
}
