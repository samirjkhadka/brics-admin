import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Role } from "@prisma/client";
import db from "@/lib/db";
import bcrypt from "bcryptjs";
import {
    checkLoginRateLimit,
    clearLoginRateLimit,
    recordFailedLogin,
} from "@/lib/auth/login-rate-limit";

/** JWT validity while the browser session is open (cookie cleared on browser close). */
const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: SESSION_MAX_AGE_SECONDS,
    },
    pages: {
        signIn: "/login",
    },
    cookies: {
        sessionToken: {
            name: `next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or Mobile", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.identifier || !credentials?.password) {
                    throw new Error("Missing credentials");
                }

                const rate = checkLoginRateLimit(credentials.identifier);
                if (!rate.ok) {
                    throw new Error(
                        `Too many login attempts. Try again in ${rate.retryAfterSec} seconds.`
                    );
                }

                const user = await db.user.findFirst({
                    where: {
                        OR: [
                            { email: credentials.identifier },
                            { mobile: credentials.identifier },
                        ],
                    },
                });

                if (!user || !user.password) {
                    recordFailedLogin(credentials.identifier);
                    throw new Error("Invalid credentials");
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    recordFailedLogin(credentials.identifier);
                    throw new Error("Invalid credentials");
                }

                clearLoginRateLimit(credentials.identifier);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role as Role;
                token.id = user.id;
            }
            if (token.id) {
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { role: true },
                });
                if (!dbUser) {
                    token.invalid = true;
                } else {
                    token.role = dbUser.role;
                    delete token.invalid;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token.invalid) {
                return { ...session, user: undefined, expires: "1970-01-01" };
            }
            if (session.user) {
                session.user.role = token.role as Role;
                session.user.id = token.id as string;
            }
            return session;
        },
    },
};
