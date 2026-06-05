import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { TRANSACTION_TEMPLATE_SAMPLE } from "@/lib/import/transaction-template";

export async function GET() {
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
