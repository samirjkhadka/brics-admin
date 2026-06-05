import db from "@/lib/db";
import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";
import TravelCalendar from "@/components/calendar/travel-calendar";
import { Calendar } from "lucide-react";

export default async function TravelCalendarPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const params = await searchParams;
    const now = new Date();
    const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
    const month = params.month ? parseInt(params.month, 10) : now.getMonth();

    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(new Date(year, month, 1));

    const flights = await db.transaction.findMany({
        where: {
            isVoided: false,
            travelDate: { gte: start, lte: end },
        },
        orderBy: { travelDate: "asc" },
        select: {
            id: true,
            salesBillNo: true,
            passengerNames: true,
            sector: true,
            partyName: true,
            travelDate: true,
        },
    });

    const serialized = flights.map((f) => ({
        ...f,
        travelDate: f.travelDate!.toISOString(),
    }));

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-brand-red/10 rounded-xl">
                        <Calendar className="text-brand-red" size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Travel Calendar</h1>
                        <p className="text-sm text-slate-500">Month view of scheduled departures</p>
                    </div>
                </div>
                <TravelCalendar
                    year={year}
                    month={month}
                    flights={JSON.parse(JSON.stringify(serialized))}
                />
            </div>
        </RoleGate>
    );
}
