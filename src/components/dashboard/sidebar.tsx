"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard,
    TicketPlus,
    ListOrdered,
    Users,
    Building2,
    ChevronLeft,
    ChevronRight,
    Calendar,
    FileBarChart,
    Settings,
    ClipboardList,
    Plane,
} from "lucide-react";
import { Role } from "@prisma/client";
import { LogoutButton } from "@/components/auth/logout-button";

export default function DashboardSidebar({
    role,
    userName,
    userEmail,
}: {
    role: Role;
    userName?: string | null;
    userEmail?: string | null;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const isSuperAdmin = role === Role.SUPERADMIN;
    const isViewer = role === Role.VIEWER;
    const canEdit = role === Role.SUPERADMIN || role === Role.ADMIN;

    return (
        <aside
            className={`${isCollapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 relative print:hidden flex-shrink-0`}
        >
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-10 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-brand-red transition-colors z-10 shadow-sm"
            >
                {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            <div className={`p-6 ${isCollapsed ? "flex justify-center" : ""}`}>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2 overflow-hidden">
                    <div className="bg-white border border-slate-200 p-1 rounded-lg flex-shrink-0">
                        <Image src="/logo.jpeg" alt="BRICS Logo" width={32} height={32} className="object-contain" />
                    </div>
                    {!isCollapsed && <span className="whitespace-nowrap">BRICS Admin</span>}
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-hidden overflow-y-auto">
                <NavItem href="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" isCollapsed={isCollapsed} />
                {canEdit && (
                    <NavItem href="/dashboard/tickets/new" icon={<TicketPlus size={18} />} label="New Ticket Entry" isCollapsed={isCollapsed} />
                )}
                <NavItem href="/dashboard/tickets" icon={<ListOrdered size={18} />} label="All Transactions" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard/calendar" icon={<Calendar size={18} />} label="Travel Calendar" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard/reports/vat" icon={<FileBarChart size={18} />} label="VAT Report" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard/reports/balance-confirmation" icon={<ClipboardList size={18} />} label="Balance Confirm" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard/reports/statements" icon={<FileBarChart size={18} />} label="Statements" isCollapsed={isCollapsed} />
                <NavItem href="/dashboard/reports/sectors" icon={<Plane size={18} />} label="Sector Analytics" isCollapsed={isCollapsed} />
                {isSuperAdmin && (
                    <>
                        <NavItem href="/dashboard/users" icon={<Users size={18} />} label="Users" isCollapsed={isCollapsed} />
                        <NavItem href="/dashboard/partners" icon={<Building2 size={18} />} label="Partners" isCollapsed={isCollapsed} />
                        <NavItem href="/dashboard/settings/fiscal-year" icon={<Settings size={18} />} label="Financial Year" isCollapsed={isCollapsed} />
                        <NavItem href="/dashboard/audit" icon={<ClipboardList size={18} />} label="Audit Log" isCollapsed={isCollapsed} />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-200 overflow-hidden space-y-3">
                {!isCollapsed && (
                    <div className="px-2 py-2 rounded-lg bg-slate-50 border border-slate-100 min-w-0">
                        <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Signed in</p>
                        <p className="text-sm font-bold text-slate-900 truncate" title={userName || undefined}>
                            {userName || userEmail || "User"}
                        </p>
                        {userName && userEmail && (
                            <p className="text-xs text-slate-500 truncate" title={userEmail}>
                                {userEmail}
                            </p>
                        )}
                        <p className="text-[10px] font-black uppercase text-brand-red mt-1">{role}</p>
                    </div>
                )}
                {isCollapsed && (
                    <div
                        className="flex justify-center"
                        title={[userName || userEmail, role].filter(Boolean).join(" · ")}
                    >
                        <div className="w-9 h-9 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-xs font-black">
                            {(userName || userEmail || "U").charAt(0).toUpperCase()}
                        </div>
                    </div>
                )}
                <LogoutButton isCollapsed={isCollapsed} />
            </div>
        </aside>
    );
}

function NavItem({
    href,
    icon,
    label,
    isCollapsed,
}: {
    href: string;
    icon: React.ReactNode;
    label: string;
    isCollapsed: boolean;
}) {
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
