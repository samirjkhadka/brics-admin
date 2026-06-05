"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { resetUserPassword } from "@/app/actions/users";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";

export default function ResetPasswordForm({ userId }: { userId: string }) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const res = await resetUserPassword(userId, { password });

        if (res.success) {
            setMessage("Password reset successfully");
            setPassword("");
        } else {
            setError(res.error || "Failed to reset password");
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 max-w-xl shadow-sm">
            <h3 className="text-lg font-black text-slate-900">Reset Password</h3>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password *</label>
                <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm"
                />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {message && <div className="text-emerald-600 text-sm">{message}</div>}
            <ButtonWithIcon
                type="submit"
                icon={KeyRound}
                disabled={loading}
                className="px-6 py-2 rounded-lg bg-slate-900 text-white font-bold disabled:opacity-50"
            >
                {loading ? "Resetting..." : "Reset Password"}
            </ButtonWithIcon>
        </form>
    );
}
