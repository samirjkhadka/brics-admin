import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

function getCronSecret(): string | null {
    const secret = process.env.CRON_SECRET?.trim();
    return secret || null;
}

export function verifyCronBearer(authHeader: string | null): boolean {
    const secret = getCronSecret();
    if (!secret || !authHeader) return false;

    const expected = `Bearer ${secret}`;
    try {
        const a = Buffer.from(authHeader);
        const b = Buffer.from(expected);
        if (a.length !== b.length) return false;
        return timingSafeEqual(a, b);
    } catch {
        return false;
    }
}

export function cronUnauthorizedResponse() {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function cronMisconfiguredResponse() {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
}

export function assertCronConfigured(): boolean {
    return Boolean(getCronSecret());
}
