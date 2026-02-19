import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET() {
    try {
        const transactions = await db.transaction.findMany({
            orderBy: { createdAt: "desc" },
        });

        const data = transactions.map((tx) => ({
            "Bill Date (BS)": tx.purchaseDateBS || tx.salesDateBS,
            "Bill Date (AD)": tx.purchaseDate ? tx.purchaseDate.toLocaleDateString() : tx.salesDate.toLocaleDateString(),
            "Travel Date (AD)": tx.travelDate?.toLocaleDateString() || "N/A",
            "Purchase Invoice No": tx.purchaseInvoiceNo,
            "Purchase Amount": tx.purchaseAmount,
            "Sales Date": tx.salesDate.toLocaleDateString(),
            "Sales Bill No": tx.salesBillNo,
            "Passenger's Name": tx.passengerNames,
            "Party Name": tx.partyName,
            "Sector": tx.sector,
            "Sales Amount": tx.salesAmount,
            "Exempt Amt": tx.exemptAmount,
            "Taxable Amt": tx.taxableAmount,
            "Output VAT": tx.vatAmount,
            "Net Profit": tx.salesAmount - tx.purchaseAmount,
            "Received On": tx.receivedStatus,
            "Received Date": tx.receivedDate?.toLocaleDateString() || "N/A",
            "Receipt No": tx.receiptNo || "",
            "Remarks": tx.remarks || "",
            "Party VAT No": tx.partyVatNo || "",
            "Contact No": tx.contactNo || "",
            "H.S. Code": tx.hsCode || "",
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": "attachment; filename=BRICS_Transactions.xlsx",
            },
        });
    } catch (error: any) {
        console.error("Excel Export Error:", error);
        return NextResponse.json({ error: "Failed to generate Excel report" }, { status: 500 });
    }
}
