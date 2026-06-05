import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const tx = await db.transaction.findUnique({
            where: { id: id },
        });

        if (!tx) {
            return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
        }

        // Load the docx file as binary content
        // Note: User needs to provide this template. I'll use a placeholder logic.
        const templatePath = path.resolve(process.cwd(), "templates/invoice_template.docx");

        if (!fs.existsSync(templatePath)) {
            return NextResponse.json({ error: "Invoice template not found. Please upload templates/invoice_template.docx" }, { status: 500 });
        }

        const stats = fs.statSync(templatePath);
        if (stats.size === 0) {
            return NextResponse.json({ error: "Invoice template is empty. Please upload a valid .docx file to templates/invoice_template.docx" }, { status: 500 });
        }

        const content = fs.readFileSync(templatePath, "binary");
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Render the document
        doc.render({
            passengerNames: tx.passengerNames,
            partyName: tx.partyName,
            sector: tx.sector,
            billNo: tx.salesBillNo,
            dateBS: tx.salesDateBS,
            dateAD: tx.salesDate.toLocaleDateString(),
            salesAmount: Number(tx.salesAmount).toLocaleString(),
            taxableAmount: Number(tx.taxableAmount).toLocaleString(),
            vatAmount: Number(tx.vatAmount).toLocaleString(),
            hsCode: tx.hsCode || "",
            partyVat: tx.partyVatNo || "",
            contact: tx.contactNo || "",
        });

        const buf = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });

        return new NextResponse(buf as any, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename=Invoice_${tx.salesBillNo}.docx`,
            },
        });
    } catch (error: any) {
        console.error("PDF Export Error:", error);
        return NextResponse.json({ error: "Failed to generate invoice" }, { status: 500 });
    }
}
