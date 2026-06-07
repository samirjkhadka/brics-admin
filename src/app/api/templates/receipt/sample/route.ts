import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import fs from "fs";
import { resolveReceiptTemplatePath } from "@/lib/templates/paths";
import { requireApiRole } from "@/lib/security/api-auth";

export async function GET() {
    const auth = await requireApiRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return auth.response;
    try {
        const templatePath = resolveReceiptTemplatePath();

        if (!templatePath) {
            return NextResponse.json(
                { error: "Receipt template not found in templates/ folder" },
                { status: 404 }
            );
        }

        const buf = fs.readFileSync(templatePath);

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": 'inline; filename="REC_BRICS_Sample.docx"',
            },
        });
    } catch (error: unknown) {
        console.error("Receipt template sample error:", error);
        return NextResponse.json({ error: "Failed to load receipt template" }, { status: 500 });
    }
}
