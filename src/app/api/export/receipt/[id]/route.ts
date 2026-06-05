import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import { resolveReceiptTemplatePath } from "@/lib/templates/paths";
import { numberToWords } from "@/lib/utils/number-to-words";

function paymentLabel(method: string): string {
    if (method === "CHEQUE") return "cheque";
    if (method === "CASH") return "cash";
    if (method === "BANK" || method === "QR") return "Online";
    return method.toLowerCase();
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const receipt =
            (await db.paymentReceipt.findFirst({
                where: { OR: [{ id }, { transactionId: id }] },
                include: { transaction: true },
            })) ||
            (await db.paymentReceipt.findFirst({
                where: { allocations: { some: { transactionId: id } } },
                include: { transaction: true },
            }));

        if (!receipt) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        const templatePath = resolveReceiptTemplatePath();

        if (!templatePath) {
            return NextResponse.json(
                {
                    error:
                        "Receipt template not found. Add REC_BRICS WORLD TRAVEL AND TOURS PVT LTD.docx to templates/",
                },
                { status: 500 }
            );
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        const amount = Number(receipt.amount);
        doc.render({
            receiptNo: receipt.receiptNo,
            partyName: receipt.partyName,
            amount: amount.toLocaleString(),
            amountWords: numberToWords(Math.round(amount * 100) / 100),
            paymentMethod: paymentLabel(receipt.paymentMethod),
            chequeNo: receipt.chequeNo || "",
            dateBS: receipt.receiptDateBS,
            dateAD: receipt.receiptDateAD.toLocaleDateString(),
            travelDate: receipt.transaction?.travelDate?.toLocaleDateString() || "",
            sector: receipt.transaction?.sector || "",
            bankName: "",
        });

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        return new NextResponse(buf as unknown as BodyInit, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename=Receipt_${receipt.receiptNo}.docx`,
            },
        });
    } catch (error: unknown) {
        console.error("Receipt Export Error:", error);
        return NextResponse.json(
            {
                error:
                    "Failed to generate receipt DOCX. Use Print for populated receipt, or add docxtemplater placeholders to the template.",
            },
            { status: 500 }
        );
    }
}
