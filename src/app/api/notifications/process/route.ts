import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendFlightAlert } from "@/lib/notifications/email";
import { sendSmsAlert } from "@/lib/notifications/sms";
import { differenceInHours } from "date-fns";

const ALERT_WINDOWS: { type: string; minHours: number; maxHours: number }[] = [
    { type: "3 days", minHours: 60, maxHours: 84 },
    { type: "2 days", minHours: 36, maxHours: 60 },
    { type: "1 day", minHours: 12, maxHours: 36 },
    { type: "12 hours", minHours: 6, maxHours: 18 },
    { type: "6 hours", minHours: 0, maxHours: 12 },
];

export async function GET(req: NextRequest) {
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

        const sentAlerts: { txId: string; type: string }[] = [];

        for (const tx of transactions) {
            if (!tx.travelDate) continue;

            const diffHours = differenceInHours(tx.travelDate, now);

            for (const window of ALERT_WINDOWS) {
                if (diffHours >= window.minHours && diffHours < window.maxHours) {
                    const existing = await db.notificationLog.findUnique({
                        where: {
                            transactionId_alertType: {
                                transactionId: tx.id,
                                alertType: window.type,
                            },
                        },
                    });

                    if (!existing) {
                        await sendFlightAlert(process.env.ADMIN_EMAIL!, tx, window.type);

                        const smsTo = process.env.ADMIN_SMS_NUMBER;
                        if (smsTo) {
                            const passenger = tx.passengerNames?.slice(0, 40) || "Passenger";
                            await sendSmsAlert(
                                smsTo,
                                `BRICS flight alert (${window.type}): ${passenger} — ${tx.sector} on ${tx.travelDate?.toLocaleDateString()}`
                            );
                        }

                        await db.notificationLog.create({
                            data: {
                                transactionId: tx.id,
                                alertType: window.type,
                            },
                        });
                        sentAlerts.push({ txId: tx.id, type: window.type });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, sent: sentAlerts });
    } catch (error: unknown) {
        console.error("Cron Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
