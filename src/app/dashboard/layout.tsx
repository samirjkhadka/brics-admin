"use client";

import { useState } from "react";
import Link from "next/link";
import {
    LayoutDashboard,
    TicketPlus,
    ListOrdered,
    Settings,
    LogOut,
    FileText,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import Image from "next/image";
import { LogoutButton } from "@/components/auth/logout-button";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900">
            {/* Sidebar */}
            <aside className={`${isCollapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative print:hidden`}>
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-brand-red transition-colors z-10 shadow-sm"
                >
                    {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>

                <div className={`p-6 ${isCollapsed ? "flex justify-center" : ""}`}>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 overflow-hidden">
                        <div className="bg-brand-red p-1.5 rounded-lg flex-shrink-0 text-white">
                            <Image src="/logo.jpeg" alt="BRICS Logo" width={32} height={32} className="object-contain brightness-0 invert" />
                        </div>
                        {!isCollapsed && <span className="whitespace-nowrap">BRICS Admin</span>}
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4 overflow-hidden">
                    <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" isCollapsed={isCollapsed} />
                    <NavItem href="/dashboard/tickets/new" icon={<TicketPlus size={18} />} label="New Ticket Entry" isCollapsed={isCollapsed} />
                    <NavItem href="/dashboard/tickets" icon={<ListOrdered size={18} />} label="All Transactions" isCollapsed={isCollapsed} />
                </nav>

                <div className="p-4 border-t border-slate-200 overflow-hidden">
                    <LogoutButton isCollapsed={isCollapsed} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}

function NavItem({ href, icon, label, isCollapsed }: { href: string; icon: React.ReactNode; label: string; isCollapsed: boolean }) {
    return (
        <Link
            href={href}
            title={isCollapsed ? label : ""}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-slate-50 text-slate-600 hover:text-brand-red transition-colors ${isCollapsed ? "justify-center" : ""}`}
        >
            <span className="flex-shrink-0">{icon}</span>
            {!isCollapsed && <span className="whitespace-nowrap">{label}</span>}
        </Link>
    );
}
