/**
 * SMS/WhatsApp provider stub — enable when TWILIO_* env vars are set.
 */
export async function sendSmsAlert(
    to: string,
    message: string
): Promise<{ sent: boolean; reason?: string }> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;

    if (!sid || !token || !from) {
        return { sent: false, reason: "SMS provider not configured" };
    }

    try {
        const auth = Buffer.from(`${sid}:${token}`).toString("base64");
        const body = new URLSearchParams({ To: to, From: from, Body: message });
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
            method: "POST",
            headers: {
                Authorization: `Basic ${auth}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
        });

        if (!res.ok) {
            const text = await res.text();
            return { sent: false, reason: text };
        }

        return { sent: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : "SMS send failed";
        return { sent: false, reason: message };
    }
}
