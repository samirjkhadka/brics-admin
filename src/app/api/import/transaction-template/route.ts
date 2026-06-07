import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import * as XLSX from "xlsx";
import { TRANSACTION_TEMPLATE_SAMPLE } from "@/lib/import/transaction-template";
import { requireApiRole } from "@/lib/security/api-auth";

export async function GET() {
    const auth = await requireApiRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return auth.response;
    const worksheet = XLSX.utils.json_to_sheet([TRANSACTION_TEMPLATE_SAMPLE]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": "attachment; filename=BRICS_Ticket_Upload_Template.xlsx",
        },
    });
}
