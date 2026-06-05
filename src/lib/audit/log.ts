import db from "@/lib/db";

export async function writeAuditLog(params: {
    userId?: string | null;
    userName?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
}) {
    try {
        await db.auditLog.create({
            data: {
                userId: params.userId || null,
                userName: params.userName || null,
                action: params.action,
                entityType: params.entityType,
                entityId: params.entityId,
                metadata: params.metadata ? (params.metadata as object) : undefined,
            },
        });
    } catch (e) {
        console.error("Audit log failed:", e);
    }
}
