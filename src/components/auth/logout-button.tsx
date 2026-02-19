"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export const LogoutButton = ({ isCollapsed }: { isCollapsed?: boolean }) => {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={isCollapsed ? "Log Out" : ""}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors ${isCollapsed ? "justify-center w-full" : "w-full"}`}
        >
            <LogOut size={18} className="flex-shrink-0" />
            {!isCollapsed && <span className="whitespace-nowrap">Log Out</span>}
        </button>
    );
};
