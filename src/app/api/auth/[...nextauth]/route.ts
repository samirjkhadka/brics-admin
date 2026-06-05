import { authOptions } from "@/lib/auth";
import { rewriteAuthResponseCookies } from "@/lib/auth/browser-session-cookie";
import NextAuth from "next-auth";

const authHandler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth: string[] }> };

async function handler(req: Request, context: RouteContext) {
    const response = await authHandler(req, context);
    return rewriteAuthResponseCookies(response);
}

export { handler as GET, handler as POST };
