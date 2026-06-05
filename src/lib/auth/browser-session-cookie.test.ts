import { describe, it, expect } from "vitest";
import { toBrowserSessionCookie } from "./browser-session-cookie";

describe("toBrowserSessionCookie", () => {
    it("strips Expires and Max-Age from session token cookies", () => {
        const input =
            "next-auth.session-token=abc123; Path=/; HttpOnly; SameSite=Lax; Expires=Wed, 01 Jan 2026 00:00:00 GMT; Max-Age=86400";
        const result = toBrowserSessionCookie(input);
        expect(result).not.toMatch(/Expires=/i);
        expect(result).not.toMatch(/Max-Age=/i);
        expect(result).toContain("next-auth.session-token=abc123");
    });

    it("leaves sign-out deletion cookies unchanged", () => {
        const input = "next-auth.session-token=; Path=/; Max-Age=0";
        expect(toBrowserSessionCookie(input)).toBe(input);
    });

    it("does not modify non-session cookies", () => {
        const input = "next-auth.csrf-token=xyz; Path=/; Max-Age=3600";
        expect(toBrowserSessionCookie(input)).toBe(input);
    });
});
