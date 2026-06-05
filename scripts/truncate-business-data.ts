/**
 * Remove all business data; keep User accounts.
 * Run: npm run db:truncate -- --confirm
 */
import { PrismaClient, FiscalYearStatus } from "@prisma/client";
import {
    getFiscalYearBounds,
    getCurrentNepalFyStartYear,
} from "../src/lib/fiscal-year/nepal-fy";
import { DEFAULT_BILL_FORMAT, DEFAULT_RECEIPT_FORMAT } from "../src/lib/fiscal-year/bill-format";

const db = new PrismaClient();

async function main() {
    const confirmed = process.argv.includes("--confirm");
    if (!confirmed) {
        console.error("Refusing to run without --confirm flag.");
        console.error("Usage: npm run db:truncate -- --confirm");
        process.exit(1);
    }

    const userCount = await db.user.count();
    console.log(`Keeping ${userCount} user(s).`);

    await db.$transaction([
        db.paymentReceiptAllocation.deleteMany(),
        db.notificationLog.deleteMany(),
        db.refund.deleteMany(),
        db.paymentReceipt.deleteMany(),
        db.transaction.deleteMany(),
        db.partnerFiscalBalance.deleteMany(),
        db.partner.deleteMany(),
        db.financialYear.deleteMany(),
        db.auditLog.deleteMany(),
    ]);

    console.log("Deleted: transactions, partners, receipts, fiscal years, audit logs.");

    const bsYearStart = getCurrentNepalFyStartYear();
    const bounds = getFiscalYearBounds(bsYearStart);
    const fy = await db.financialYear.create({
        data: {
            label: bounds.label,
            bsYearStart: bounds.bsYearStart,
            billPrefixYear: bounds.billPrefixYear,
            startDateAD: bounds.startDateAD,
            endDateAD: bounds.endDateAD,
            startDateBS: bounds.startDateBS,
            endDateBS: bounds.endDateBS,
            status: FiscalYearStatus.OPEN,
            nextBillSeq: 1,
            nextReceiptSeq: 1,
            billNoFormat: DEFAULT_BILL_FORMAT,
            receiptNoFormat: DEFAULT_RECEIPT_FORMAT,
        },
    });

    console.log(`Created fresh open FY: ${fy.label} (next bill: ${bounds.billPrefixYear}-001)`);
    console.log("Done. You can upload fresh data.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => db.$disconnect());
