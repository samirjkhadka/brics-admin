"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                identifier,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError("Invalid credentials");
            } else {
                router.push("/dashboard");
                router.refresh();
            }
        } catch (err) {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl border border-slate-200 shadow-xl">
                <div className="text-center">
                    <img src="/logo.jpeg" alt="BRICS Logo" className="w-24 h-24 object-contain mx-auto mb-4 border border-slate-100 rounded-2xl p-2 bg-slate-50 shadow-sm" />
                    <h2 className="mt-2 text-4xl font-black text-slate-900 tracking-tight">
                        BRICS <span className="text-brand-red">Admin</span>
                    </h2>
                    <p className="mt-3 text-sm text-slate-500 font-medium">
                        Secure Access to Business Intelligence
                    </p>
                </div>
                <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-semibold">
                            {error}
                        </div>
                    )}
                    <div className="space-y-5">
                        <div>
                            <label className="text-xs font-black text-slate-800 uppercase tracking-widest block mb-2">
                                Identifier
                            </label>
                            <input
                                type="text"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red focus:z-10 sm:text-sm transition-all"
                                placeholder="Email or Mobile"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs font-black text-slate-800 uppercase tracking-widest block mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                className="appearance-none rounded-xl relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red focus:z-10 sm:text-sm transition-all"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-black rounded-xl text-white bg-brand-red hover:bg-brand-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-red transition-all shadow-lg shadow-brand-red/20 active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? "Verifying..." : "Sign in to Dashboard"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
