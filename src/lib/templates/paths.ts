import fs from "fs";
import path from "path";

export const RECEIPT_TEMPLATE_CANDIDATES = [
    "REC_BRICS WORLD TRAVEL AND TOURS PVT LTD.docx",
    "receipt_template.docx",
] as const;

export function resolveReceiptTemplatePath(): string | null {
    const templatesDir = path.resolve(process.cwd(), "templates");
    for (const filename of RECEIPT_TEMPLATE_CANDIDATES) {
        const fullPath = path.join(templatesDir, filename);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).size > 0) {
            return fullPath;
        }
    }
    return null;
}
