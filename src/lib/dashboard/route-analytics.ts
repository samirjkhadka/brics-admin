import db from "@/lib/db";
import { countAirportUsage, countRouteUsage } from "@/lib/data/airports";

export async function getRouteAnalytics() {
    const transactions = await db.transaction.findMany({
        where: { isVoided: false },
        select: { sector: true },
    });

    const sectors = transactions.map((tx) => tx.sector);

    return {
        airportUsage: countAirportUsage(sectors),
        routeUsage: countRouteUsage(sectors),
    };
}
