import db from "@/lib/db";
import { enforcePageRole, RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";

export default async function AuditPage() {
    await enforcePageRole([Role.SUPERADMIN]);

    const logs = await db.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
    });

    return (
        <RoleGate allowed={[Role.SUPERADMIN]}>
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-black text-slate-900">Audit Log</h1>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                                <th className="px-4 py-3 text-left">When</th>
                                <th className="px-4 py-3 text-left">User</th>
                                <th className="px-4 py-3 text-left">Action</th>
                                <th className="px-4 py-3 text-left">Entity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{log.createdAt.toLocaleString()}</td>
                                    <td className="px-4 py-3">{log.userName || log.userId || "—"}</td>
                                    <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                                    <td className="px-4 py-3 text-slate-600">{log.entityType} / {log.entityId.slice(0, 8)}…</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </RoleGate>
    );
}
