import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const transactions = await db.transaction.findMany({
            where: { isVoided: false },
            orderBy: { createdAt: "desc" },
        });

        const data = transactions.map((tx) => ({
            "Sales Bill No": tx.salesBillNo,
            "Sales Date": tx.salesDate.toISOString().split("T")[0],
            PARTY: tx.partyName,
            "Client Name": formatPassengerNames(tx.passengerNames),
            "Sale Amount": Number(tx.salesAmount),
            "Purchase Amount": Number(tx.purchaseAmount),
            "Output VAT": Number(tx.vatAmount),
            Sector: tx.sector,
        }));

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
            path: filePath,
            rows: transactions.length,
        });
    } catch (error: unknown) {
        console.error("Backup Error:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
