import { NextResponse } from "next/server";
import fs from "fs";
import { resolveReceiptTemplatePath } from "@/lib/templates/paths";

export async function GET() {
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
