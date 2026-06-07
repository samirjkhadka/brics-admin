import { redirect } from "next/navigation";
import Script from "next/script";
import { getSession } from "@/lib/auth/session";
import DashboardSidebar from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session?.user?.role) {
        redirect("/login");
    }

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900">
            <link
                rel="stylesheet"
                href="/vendor/nepali-date-picker/nepali.datepicker.v5.0.6.min.css"
            />
            <Script
                src="/vendor/nepali-date-picker/nepali.datepicker.v5.0.6.min.js"
                strategy="beforeInteractive"
            />
            <DashboardSidebar
                role={session.user.role}
                userName={session.user.name}
                userEmail={session.user.email}
            />
            <main className="flex-1 overflow-auto p-8 print:p-0">{children}</main>
        </div>
    );
}
