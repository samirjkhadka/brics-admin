import db from "@/lib/db";
import { PartnerType } from "@prisma/client";
import { formatPassengerNames } from "@/lib/utils/parse-passengers";
import { adToBs } from "@/lib/utils/nepali-calendar";
import { sumRefundTotals } from "@/lib/refunds/helpers";

export type PartyLedgerSummary = {
    partyName: string;
    partnerId: string | null;
    billCount: number;
    openingBalance: number;
    totalBilled: number;
    totalReceived: number;
    totalRefunded: number;
    closingBalance: number;
};

export type PartyLedgerLine = {
    date: Date;
    dateBS: string;
    voucherType: "Opening" | "Sales" | "Receipt" | "Credit Note" | "Refund";
    billNo: string | null;
    receiptNo: string | null;
    reference: string;
    passengerNames: string | null;
    travelDateAD: string | null;
    travelDateBS: string | null;
    transactionId: string | null;
    linkedBillNos: string[];
    debit: number;
    credit: number;
    balance: number;
};

export type SupplierStatementRow = {
    supplierName: string;
    partnerId: string | null;
    count: number;
    purchase: number;
    creditNotes: number;
    netPurchase: number;
    paymentsMade: number;
    balanceDue: number;
};

function normalizeName(name: string): string {
    return name.trim().toLowerCase();
}

function partyMatches(partyName: string, candidate: string): boolean {
    return normalizeName(partyName) === normalizeName(candidate);
}

export function computePartyTotalReceived(
    partyName: string,
    transactions: { id: string; partyName: string; amountReceived: { toString(): string } | number }[],
    receipts: {
        partyName: string;
        amount: { toString(): string } | number;
        allocations: { transactionId: string }[];
    }[],
    refunds: { partyName: string; customerCashAmount: { toString(): string } | number }[] = []
): number {
    const partyReceipts = receipts.filter((r) => partyMatches(partyName, r.partyName));
    const coveredTxIds = new Set<string>();
    let received = 0;

    for (const receipt of partyReceipts) {
        received += Number(receipt.amount);
        receipt.allocations.forEach((a) => coveredTxIds.add(a.transactionId));
    }

    for (const tx of transactions) {
        if (!partyMatches(partyName, tx.partyName)) continue;
        if (coveredTxIds.has(tx.id)) continue;
        const amount = Number(tx.amountReceived);
        if (amount > 0) received += amount;
    }

    const cashRefunded = refunds
        .filter((r) => partyMatches(partyName, r.partyName))
        .reduce((s, r) => s + Number(r.customerCashAmount), 0);

    return received - cashRefunded;
}

export function computeClosingBalance(
    opening: number,
    billed: number,
    received: number
): number {
    return opening + billed - received;
}

function formatTravelDate(tx: { travelDate: Date | null }): { ad: string | null; bs: string | null } {
    if (!tx.travelDate) return { ad: null, bs: null };
    return {
        ad: tx.travelDate.toLocaleDateString(),
        bs: adToBs(tx.travelDate),
    };
}

type RefundWithParty = {
    refundDateAD: Date;
    refundDateBS: string;
    customerRefundAmount: { toString(): string } | number;
    customerCashAmount: { toString(): string } | number;
    supplierCreditAmount: { toString(): string } | number;
    supplierCreditNoteNo: string | null;
    transaction: {
        id: string;
        partyName: string;
        purchasePartyName: string;
        salesBillNo: string;
        passengerNames: string;
    };
};

export async function getPartyLedgerSummary(
    fiscalYearId: string
): Promise<PartyLedgerSummary[]> {
    const fy = await db.financialYear.findUnique({ where: { id: fiscalYearId } });
    if (!fy) return [];

    const [partners, balances, transactions, receipts, refunds] = await Promise.all([
        db.partner.findMany({ where: { type: PartnerType.CUSTOMER, isActive: true } }),
        db.partnerFiscalBalance.findMany({ where: { fiscalYearId } }),
        db.transaction.findMany({
            where: {
                fiscalYearId,
                isVoided: false,
            },
            include: { refunds: true },
        }),
        db.paymentReceipt.findMany({
            where: { fiscalYearId },
            include: { allocations: { select: { transactionId: true } } },
        }),
        db.refund.findMany({
            where: { fiscalYearId },
            include: {
                transaction: { select: { partyName: true } },
            },
        }),
    ]);

    const balanceMap = new Map(balances.map((b) => [b.partnerId, Number(b.openingBalance)]));
    const partnerByName = new Map(partners.map((p) => [normalizeName(p.name), p]));

    const partyNames = new Set<string>();
    partners.forEach((p) => partyNames.add(p.name));
    transactions.forEach((t) => partyNames.add(t.partyName));
    receipts.forEach((r) => partyNames.add(r.partyName));

    const refundCashByParty = refunds.map((r) => ({
        partyName: r.transaction.partyName,
        customerCashAmount: r.customerCashAmount,
    }));

    const summaries: PartyLedgerSummary[] = [];

    for (const partyName of partyNames) {
        const partner = partnerByName.get(normalizeName(partyName));
        const opening = partner ? balanceMap.get(partner.id) || 0 : 0;

        const partyTxs = transactions.filter(
            (t) => normalizeName(t.partyName) === normalizeName(partyName)
        );

        const grossBilled = partyTxs.reduce((s, t) => s + Number(t.salesAmount), 0);
        const totalRefunded = partyTxs.reduce((s, t) => {
            const totals = sumRefundTotals(t.refunds);
            return s + totals.customerRefund;
        }, 0);
        const billed = grossBilled - totalRefunded;

        const received = computePartyTotalReceived(
            partyName,
            transactions,
            receipts,
            refundCashByParty
        );

        const closing = computeClosingBalance(opening, billed, received);

        const billCount = partyTxs.length;

        if (opening === 0 && billed === 0 && received === 0 && totalRefunded === 0) continue;

        summaries.push({
            partyName,
            partnerId: partner?.id || null,
            billCount,
            openingBalance: opening,
            totalBilled: billed,
            totalReceived: received,
            totalRefunded,
            closingBalance: closing,
        });
    }

    return summaries.sort((a, b) => a.partyName.localeCompare(b.partyName));
}

export async function getPartyLedgerLines(
    fiscalYearId: string,
    partyName: string
): Promise<PartyLedgerLine[]> {
    const [partners, balances, allTransactions, allReceipts, allRefunds] = await Promise.all([
        db.partner.findMany({ where: { type: PartnerType.CUSTOMER } }),
        db.partnerFiscalBalance.findMany({ where: { fiscalYearId } }),
        db.transaction.findMany({
            where: { fiscalYearId, isVoided: false },
            orderBy: { salesDate: "asc" },
            include: { refunds: { orderBy: { refundDateAD: "asc" } } },
        }),
        db.paymentReceipt.findMany({
            where: { fiscalYearId },
            include: {
                allocations: {
                    include: { transaction: { select: { id: true, salesBillNo: true } } },
                },
            },
            orderBy: { receiptDateAD: "asc" },
        }),
        db.refund.findMany({
            where: { fiscalYearId },
            include: {
                transaction: {
                    select: {
                        id: true,
                        partyName: true,
                        purchasePartyName: true,
                        salesBillNo: true,
                        passengerNames: true,
                    },
                },
            },
            orderBy: { refundDateAD: "asc" },
        }),
    ]);

    const partner = partners.find((p) => partyMatches(partyName, p.name));
    const balance = partner
        ? Number(balances.find((b) => b.partnerId === partner.id)?.openingBalance || 0)
        : 0;

    const transactions = allTransactions.filter((t) => partyMatches(partyName, t.partyName));
    const receipts = allReceipts.filter((r) => partyMatches(partyName, r.partyName));
    const refunds = allRefunds.filter((r) => partyMatches(partyName, r.transaction.partyName));
    const coveredTxIds = new Set(
        receipts.flatMap((r) => r.allocations.map((a) => a.transactionId))
    );

    const lines: Omit<PartyLedgerLine, "balance">[] = [
        {
            date: new Date(0),
            dateBS: "—",
            voucherType: "Opening",
            billNo: null,
            receiptNo: null,
            reference: "Opening Balance",
            passengerNames: null,
            travelDateAD: null,
            travelDateBS: null,
            transactionId: null,
            linkedBillNos: [],
            debit: balance > 0 ? balance : 0,
            credit: balance < 0 ? Math.abs(balance) : 0,
        },
    ];

    transactions.forEach((t) => {
        const travel = formatTravelDate(t);
        lines.push({
            date: t.salesDate,
            dateBS: t.salesDateBS,
            voucherType: "Sales",
            billNo: t.salesBillNo,
            receiptNo: null,
            reference: t.salesBillNo,
            passengerNames: formatPassengerNames(t.passengerNames),
            travelDateAD: travel.ad,
            travelDateBS: travel.bs,
            transactionId: t.id,
            linkedBillNos: [t.salesBillNo],
            debit: Number(t.salesAmount),
            credit: 0,
        });
    });

    receipts.forEach((r) => {
        const linkedBillNos = r.allocations.map((a) => a.transaction.salesBillNo);
        const billLabel = linkedBillNos.length
            ? linkedBillNos.map((b) => `#${b}`).join(", ")
            : null;
        lines.push({
            date: r.receiptDateAD,
            dateBS: r.receiptDateBS,
            voucherType: "Receipt",
            billNo: billLabel,
            receiptNo: r.receiptNo,
            reference: billLabel ? `${r.receiptNo} — Bills ${billLabel}` : r.receiptNo,
            passengerNames: null,
            travelDateAD: null,
            travelDateBS: null,
            transactionId: r.allocations.length === 1 ? r.allocations[0].transaction.id : null,
            linkedBillNos,
            debit: 0,
            credit: Number(r.amount),
        });
    });

    transactions.forEach((t) => {
        if (coveredTxIds.has(t.id)) return;
        const amount = Number(t.amountReceived);
        if (amount <= 0 || !t.receivedDate) return;

        lines.push({
            date: t.receivedDate,
            dateBS: adToBs(t.receivedDate),
            voucherType: "Receipt",
            billNo: t.salesBillNo,
            receiptNo: t.receiptNo,
            reference: t.receiptNo
                ? `${t.receiptNo} — Bill #${t.salesBillNo}`
                : `Payment — Bill #${t.salesBillNo}`,
            passengerNames: null,
            travelDateAD: null,
            travelDateBS: null,
            transactionId: t.id,
            linkedBillNos: [t.salesBillNo],
            debit: 0,
            credit: amount,
        });
    });

    refunds.forEach((r) => {
        const billNo = r.transaction.salesBillNo;
        const creditAmount = Number(r.customerRefundAmount);
        if (creditAmount > 0) {
            lines.push({
                date: r.refundDateAD,
                dateBS: r.refundDateBS,
                voucherType: "Credit Note",
                billNo,
                receiptNo: null,
                reference: r.supplierCreditNoteNo
                    ? `Credit Note — Bill #${billNo} (CN ${r.supplierCreditNoteNo})`
                    : `Credit Note — Bill #${billNo}`,
                passengerNames: formatPassengerNames(r.transaction.passengerNames),
                travelDateAD: null,
                travelDateBS: null,
                transactionId: r.transaction.id,
                linkedBillNos: [billNo],
                debit: 0,
                credit: creditAmount,
            });
        }

        const cashAmount = Number(r.customerCashAmount);
        if (cashAmount > 0) {
            lines.push({
                date: r.refundDateAD,
                dateBS: r.refundDateBS,
                voucherType: "Refund",
                billNo,
                receiptNo: null,
                reference: `Refund to customer — Bill #${billNo}`,
                passengerNames: null,
                travelDateAD: null,
                travelDateBS: null,
                transactionId: r.transaction.id,
                linkedBillNos: [billNo],
                debit: cashAmount,
                credit: 0,
            });
        }
    });

    lines.sort((a, b) => a.date.getTime() - b.date.getTime());

    let running = 0;
    return lines.map((line) => {
        running += line.debit - line.credit;
        return { ...line, balance: running };
    });
}

export async function getSupplierStatement(fiscalYearId: string): Promise<SupplierStatementRow[]> {
    const [purchaseLegs, refunds, payments, suppliers] = await Promise.all([
        db.purchaseLeg.findMany({
            where: { transaction: { fiscalYearId, isVoided: false } },
            select: {
                purchasePartyName: true,
                purchaseAmount: true,
                purchaseInvoiceNo: true,
            },
        }),
        db.refund.findMany({
            where: { fiscalYearId },
            include: {
                transaction: { select: { purchasePartyName: true } },
            },
        }),
        db.supplierPayment.findMany({
            where: { fiscalYearId },
            select: { supplierName: true, amount: true },
        }),
        db.partner.findMany({
            where: { type: PartnerType.SUPPLIER, isActive: true },
            select: { id: true, name: true },
        }),
    ]);

    const supplierByName = new Map(suppliers.map((p) => [normalizeName(p.name), p]));

    const map = new Map<
        string,
        { purchase: number; count: number; creditNotes: number; paymentsMade: number }
    >();
    for (const leg of purchaseLegs) {
        const key = leg.purchasePartyName || "Unspecified";
        const cur = map.get(key) || { purchase: 0, count: 0, creditNotes: 0, paymentsMade: 0 };
        cur.purchase += Number(leg.purchaseAmount);
        cur.count += 1;
        map.set(key, cur);
    }

    for (const r of refunds) {
        const credit = Number(r.supplierCreditAmount);
        if (credit <= 0) continue;
        const key = r.transaction.purchasePartyName || "Unspecified";
        const cur = map.get(key) || { purchase: 0, count: 0, creditNotes: 0, paymentsMade: 0 };
        cur.creditNotes += credit;
        map.set(key, cur);
    }

    for (const payment of payments) {
        const key = payment.supplierName || "Unspecified";
        const cur = map.get(key) || { purchase: 0, count: 0, creditNotes: 0, paymentsMade: 0 };
        cur.paymentsMade += Number(payment.amount);
        map.set(key, cur);
    }

    return Array.from(map.entries())
        .map(([name, data]) => {
            const netPurchase = data.purchase - data.creditNotes;
            return {
                supplierName: name,
                partnerId: supplierByName.get(normalizeName(name))?.id || null,
                count: data.count,
                purchase: data.purchase,
                creditNotes: data.creditNotes,
                netPurchase,
                paymentsMade: data.paymentsMade,
                balanceDue: netPurchase - data.paymentsMade,
            };
        })
        .filter((row) => row.purchase > 0 || row.creditNotes > 0 || row.paymentsMade > 0)
        .sort((a, b) => a.supplierName.localeCompare(b.supplierName));
}
