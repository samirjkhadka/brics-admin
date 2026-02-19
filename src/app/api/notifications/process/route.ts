import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendFlightAlert } from "@/lib/notifications/email";
import { differenceInHours, differenceInDays } from "date-fns";

export async function GET(req: NextRequest) {
    // Simple auth check via header (e.g. CRON_SECRET)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const now = new Date();
        const transactions = await db.transaction.findMany({
            where: {
                travelDate: {
                    gt: now,
                },
            },
        });

        const sentAlerts = [];

        for (const tx of transactions) {
            if (!tx.travelDate) continue;

            const diffHours = differenceInHours(tx.travelDate, now);
            const diffDays = differenceInDays(tx.travelDate, now);

            let alertType = "";

            // Schedule: 3 days, 2 days, 1 day, 12 hours, and 6 hours
            if (diffDays === 3 && tx.travelDate.getHours() === now.getHours()) alertType = "3 days";
            else if (diffDays === 2 && tx.travelDate.getHours() === now.getHours()) alertType = "2 days";
            else if (diffDays === 1 && tx.travelDate.getHours() === now.getHours()) alertType = "1 day";
            else if (diffHours === 12) alertType = "12 hours";
            else if (diffHours === 6) alertType = "6 hours";

            if (alertType) {
                await sendFlightAlert(process.env.ADMIN_EMAIL!, tx, alertType);
                sentAlerts.push({ txId: tx.id, type: alertType });
            }
        }

        return NextResponse.json({ success: true, sent: sentAlerts });
    } catch (error: any) {
        console.error("Cron Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
