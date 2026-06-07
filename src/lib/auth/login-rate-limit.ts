const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;

type AttemptEntry = { count: number; resetAt: number };

const attempts = new Map<string, AttemptEntry>();

function normalizeKey(identifier: string): string {
    return identifier.trim().toLowerCase();
}

export function checkLoginRateLimit(
    identifier: string
): { ok: true } | { ok: false; retryAfterSec: number } {
    const key = normalizeKey(identifier);
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || now > entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return { ok: true };
    }

    if (entry.count >= MAX_ATTEMPTS) {
        return { ok: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
    }

    entry.count += 1;
    return { ok: true };
}

export function recordFailedLogin(identifier: string) {
    const key = normalizeKey(identifier);
    const now = Date.now();
    const entry = attempts.get(key);

    if (!entry || now > entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return;
    }

    entry.count += 1;
}

export function clearLoginRateLimit(identifier: string) {
    attempts.delete(normalizeKey(identifier));
}
