import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { sendFlightAlert } from "@/lib/notifications/email";
import { sendSmsAlert } from "@/lib/notifications/sms";
import { differenceInHours } from "date-fns";
import {
    assertCronConfigured,
    cronMisconfiguredResponse,
    cronUnauthorizedResponse,
    verifyCronBearer,
} from "@/lib/security/cron-auth";
import { publicErrorMessage } from "@/lib/security/sanitize-error";
import { formatDisplayDate } from "@/lib/utils/format-display-date";

const ALERT_WINDOWS: { type: string; minHours: number; maxHours: number }[] = [
    { type: "3 days", minHours: 60, maxHours: 84 },
    { type: "2 days", minHours: 36, maxHours: 60 },
    { type: "1 day", minHours: 12, maxHours: 36 },
    { type: "12 hours", minHours: 6, maxHours: 18 },
    { type: "6 hours", minHours: 0, maxHours: 12 },
];

export async function GET(req: NextRequest) {
    if (!assertCronConfigured()) {
        return cronMisconfiguredResponse();
    }
    if (!verifyCronBearer(req.headers.get("authorization"))) {
        return cronUnauthorizedResponse();
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
                                `BRICS flight alert (${window.type}): ${passenger} — ${tx.sector} on ${formatDisplayDate(tx.travelDate)}`
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
        return NextResponse.json(
            { error: publicErrorMessage(error, "Notification job failed") },
            { status: 500 }
        );
    }
}
