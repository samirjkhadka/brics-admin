import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import fs from "fs";
import path from "path";
import {
    assertCronConfigured,
    cronMisconfiguredResponse,
    cronUnauthorizedResponse,
    verifyCronBearer,
} from "@/lib/security/cron-auth";
import { sanitizeSpreadsheetRow } from "@/lib/security/sanitize-export-cell";
import { publicErrorMessage } from "@/lib/security/sanitize-error";

export async function GET(req: NextRequest) {
    if (!assertCronConfigured()) {
        return cronMisconfiguredResponse();
    }
    if (!verifyCronBearer(req.headers.get("authorization"))) {
        return cronUnauthorizedResponse();
    }

    try {
        const transactions = await db.transaction.findMany({
            where: { isVoided: false },
            orderBy: [{ billSequence: "desc" }, { salesBillNo: "desc" }],
        });

        const data = transactions.map((tx) =>
            sanitizeSpreadsheetRow({
                "S.N.": tx.billSequence ?? "",
                "Sales Bill No": tx.salesBillNo,
                "Sales Date": tx.salesDate.toISOString().split("T")[0],
                PARTY: tx.partyName,
                "Client Name": formatPassengerNames(tx.passengerNames),
                "Sale Amount": Number(tx.salesAmount),
                "Purchase Amount": Number(tx.purchaseAmount),
                "Output VAT": Number(tx.vatAmount),
                Sector: tx.sector,
            })
        );

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        const backupDir = path.resolve(process.cwd(), "backups");
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filePath = path.join(backupDir, `BRICS_Backup_${stamp}.xlsx`);
        fs.writeFileSync(filePath, buf);

        return NextResponse.json({
            success: true,
            rows: transactions.length,
        });
    } catch (error: unknown) {
        return NextResponse.json(
            { error: publicErrorMessage(error, "Backup failed") },
            { status: 500 }
        );
    }
}
