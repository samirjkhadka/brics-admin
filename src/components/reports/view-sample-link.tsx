import Link from "next/link";
import { Eye } from "lucide-react";

export default function ViewSampleLink({ href }: { href: string }) {
    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm border border-slate-200 shadow-sm transition-colors"
        >
            <Eye size={16} />
            View Sample
        </Link>
    );
}
