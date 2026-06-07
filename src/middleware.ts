import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/login",
    },
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/api/export/:path*",
        "/api/import/:path*",
        "/api/templates/:path*",
    ],
};
