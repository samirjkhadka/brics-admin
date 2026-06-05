import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import * as XLSX from "xlsx";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import { Prisma } from "@prisma/client";
import { sumRefundTotals } from "@/lib/refunds/helpers";

function parseDateParam(value: string | null): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
}

export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const excludeVoided = params.get("excludeVoided") !== "false";
        const filterType = params.get("filterType") || "ALL";
        const dateField = params.get("dateField") === "travel" ? "travel" : "sales";
        const search = params.get("search")?.trim().toLowerCase() || "";
        const startDate = parseDateParam(params.get("startDate"));
        const endDate = parseDateParam(params.get("endDate"));
        const billNoFrom = params.get("billNoFrom")?.trim().toLowerCase() || "";
        const billNoTo = params.get("billNoTo")?.trim().toLowerCase() || "";
        const selectedMonth = params.get("selectedMonth");
        const selectedYear = params.get("selectedYear");

        const matchesBillNoRange = (billNo: string) => {
            const normalized = billNo.trim().toLowerCase();
            if (!billNoFrom && !billNoTo) return true;
            if (billNoFrom && billNoTo) return normalized >= billNoFrom && normalized <= billNoTo;
            if (billNoFrom) return normalized >= billNoFrom;
            return normalized <= billNoTo;
        };

        const where: Prisma.TransactionWhereInput = {};
        if (excludeVoided) where.isVoided = false;

        const transactions = await db.transaction.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: { refunds: true },
        });

        const filtered = transactions.filter((tx) => {
            if (search) {
                const haystack = [
                    tx.passengerNames,
                    tx.partyName,
                    tx.salesBillNo,
                    tx.purchaseInvoiceNo,
                    tx.sector,
                ]
                    .join(" ")
                    .toLowerCase();
                if (!haystack.includes(search)) return false;
            }

            if (filterType === "ALL") return true;

            const raw = dateField === "sales" ? tx.salesDate : tx.travelDate;
            if (!raw) {
                if (filterType === "CUSTOM") {
                    const hasDateFilter = Boolean(startDate || endDate);
                    const hasBillFilter = Boolean(billNoFrom || billNoTo);
                    if (!hasDateFilter && !hasBillFilter) return true;
                    if (hasDateFilter) return false;
                    return matchesBillNoRange(tx.salesBillNo);
                }
                return false;
            }

            const txDate = new Date(raw);

            if (filterType === "MONTH" && selectedMonth != null && selectedYear) {
                return (
                    txDate.getMonth().toString() === selectedMonth &&
                    txDate.getFullYear().toString() === selectedYear
                );
            }

            if (filterType === "YEAR" && selectedYear) {
                return txDate.getFullYear().toString() === selectedYear;
            }

            if (filterType === "CUSTOM") {
                const hasDateFilter = Boolean(startDate || endDate);
                const hasBillFilter = Boolean(billNoFrom || billNoTo);
                if (!hasDateFilter && !hasBillFilter) return true;
                if (!raw && hasDateFilter) return false;

                const dateOk = !hasDateFilter || (() => {
                    const start = startDate || new Date(0);
                    const end = endDate || new Date();
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                    return txDate >= start && txDate <= end;
                })();
                const billOk = !hasBillFilter || matchesBillNoRange(tx.salesBillNo);
                return dateOk && billOk;
            }

            return true;
        });

        const data = filtered.map((tx) => {
            const refundTotals = sumRefundTotals(tx.refunds);
            return {
            "Bill Date (BS)": tx.purchaseDateBS || tx.salesDateBS,
            "Bill Date (AD)": tx.purchaseDate
                ? tx.purchaseDate.toISOString().split("T")[0]
                : tx.salesDate.toISOString().split("T")[0],
            "Travel Date": tx.travelDate?.toISOString().split("T")[0] || "",
            "Purchase Invoice No": tx.purchaseInvoiceNo,
            "Purchase Amount": Number(tx.purchaseAmount),
            "Sales Date": tx.salesDate.toISOString().split("T")[0],
            "Sales Bill No": tx.salesBillNo,
            "Client Name": formatPassengerNames(tx.passengerNames),
            PARTY: tx.partyName,
            Sector: tx.sector,
            "Sale Amount": Number(tx.salesAmount),
            "Segregate of Sales Amount as per Bill": Number(tx.salesAmount),
            Exempt: Number(tx.exemptAmount),
            Taxable: Number(tx.taxableAmount),
            "Output VAT": Number(tx.vatAmount),
            "Payment Status": tx.paymentStatus,
            "Amount Received": Number(tx.amountReceived),
            "Recieved On": tx.receivedStatus,
            "Received Date": tx.receivedDate?.toISOString().split("T")[0] || "",
            "Receipt No": tx.receiptNo || "",
            Remarks: tx.remarks || "",
            "Other Remarks": "",
            "Purchased From": tx.purchasePartyName,
            "Cheque No": tx.chequeNo || "",
            "Party VAT No": tx.partyVatNo || "",
            "Contact No": tx.contactNo || "",
            "H.S. Code": tx.hsCode || "",
            "Is Voided": tx.isVoided ? "Yes" : "No",
            "Void Reason": tx.voidReason || "",
            "Refund Status": tx.refundStatus,
            "Customer Refunded": refundTotals.customerRefund,
            "Cash Refunded": refundTotals.customerCash,
            "Supplier Credit": refundTotals.supplierCredit,
        };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
        const filename =
            filterType !== "ALL" || search
                ? "BRICS_Transactions_Filtered.xlsx"
                : "BRICS_Transactions.xlsx";

        return new NextResponse(buf, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename=${filename}`,
            },
        });
    } catch (error: unknown) {
        console.error("Excel Export Error:", error);
        return NextResponse.json({ error: "Failed to generate Excel report" }, { status: 500 });
    }
}
