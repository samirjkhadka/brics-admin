import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { Role } from "@prisma/client";
import { startOfMonth, endOfMonth } from "date-fns";
import { requireApiRole } from "@/lib/security/api-auth";
import { sanitizeSpreadsheetRow } from "@/lib/security/sanitize-export-cell";

export async function GET(req: NextRequest) {
    const auth = await requireApiRole([Role.SUPERADMIN, Role.ADMIN]);
    if (!auth.ok) return auth.response;
    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth()), 10);

    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(new Date(year, month, 1));

    const transactions = await db.transaction.findMany({
        where: { isVoided: false, salesDate: { gte: start, lte: end } },
        orderBy: [{ billSequence: "desc" }, { salesBillNo: "desc" }],
    });

    const rows = transactions.map((tx) =>
        sanitizeSpreadsheetRow({
            "S.N.": tx.billSequence ?? "",
            "Sales Bill No": tx.salesBillNo,
            Party: tx.partyName,
            "Sales Date": tx.salesDate.toISOString().split("T")[0],
            "Sales Amount": Number(tx.salesAmount),
            "Purchase Amount": Number(tx.purchaseAmount),
            Exempt: Number(tx.exemptAmount),
            Taxable: Number(tx.taxableAmount),
            "Output VAT": Number(tx.vatAmount),
            "Net Profit": Number(tx.salesAmount) - Number(tx.purchaseAmount),
        })
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "VAT Report");
    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=BRICS_VAT_${year}_${month + 1}.xlsx`,
        },
    });
}
