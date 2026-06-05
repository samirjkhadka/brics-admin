/** Rewrite NextAuth session Set-Cookie headers to browser session cookies (no Expires/Max-Age). */

const SESSION_TOKEN_PREFIX = "next-auth.session-token";

function isSessionTokenCookie(setCookie: string): boolean {
    const name = setCookie.split("=")[0]?.trim() ?? "";
    return name === SESSION_TOKEN_PREFIX || name.startsWith(`${SESSION_TOKEN_PREFIX}.`);
}

/** Remove persistent expiry so the cookie is cleared when the browser closes. */
export function toBrowserSessionCookie(setCookie: string): string {
    if (!isSessionTokenCookie(setCookie)) return setCookie;
    if (/;\s*Max-Age=0\b/i.test(setCookie)) return setCookie;
    return setCookie
        .replace(/;\s*Expires=[^;]*/gi, "")
        .replace(/;\s*Max-Age=[^;]*/gi, "");
}

export function rewriteAuthResponseCookies(response: Response): Response {
    const headers = new Headers(response.headers);
    const setCookies =
        typeof headers.getSetCookie === "function"
            ? headers.getSetCookie()
            : headers.get("set-cookie")
              ? [headers.get("set-cookie")!]
              : [];

    if (setCookies.length === 0) return response;

    headers.delete("set-cookie");
    for (const cookie of setCookies) {
        headers.append("set-cookie", toBrowserSessionCookie(cookie));
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}
