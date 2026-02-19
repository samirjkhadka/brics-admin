"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calculateTax, bsToAd } from "@/lib/utils/calculations";

export async function createTransaction(formData: any) {
    try {
        const {
            passengerNames,
            partyName,
            sector,
            salesBillNo,
            salesDate,     // AD string from form
            salesDateBS,   // BS string from form
            purchaseInvoiceNo,
            purchaseDate,   // AD string from form
            purchaseDateBS, // BS string from form
            purchaseAmount,
            salesAmount,
            exemptAmount = 0,
            receivedStatus,
            receivedDate,
            receiptNo,
            remarks,
            travelDate,
            partyVatNo,
            contactNo,
            hsCode,
        } = formData;

        // Backend Validation
        const pAmt = parseFloat(purchaseAmount) || 0;
        const sAmt = parseFloat(salesAmount) || 0;
        const eAmt = parseFloat(exemptAmount) || 0;

        if (pAmt < 0 || sAmt < 0 || eAmt < 0) {
            return { success: false, error: "Amounts cannot be negative" };
        }

        if (sAmt < eAmt) {
            return { success: false, error: "Exempt amount cannot be greater than sales amount" };
        }

        const { taxableAmount, vatAmount } = calculateTax(sAmt, eAmt);

        const sDate = salesDate ? new Date(salesDate) : new Date();
        const pDate = purchaseDate ? new Date(purchaseDate) : null;

        const passengerData = typeof passengerNames === 'string' ? passengerNames : JSON.stringify(passengerNames);

        const transaction = await db.transaction.create({
            data: {
                passengerNames: passengerData,
                partyName,
                sector,
                salesBillNo,
                salesDate: sDate,
                salesDateBS,
                purchaseInvoiceNo,
                purchaseDate: pDate,
                purchaseDateBS,
                purchaseAmount: pAmt,
                salesAmount: sAmt,
                exemptAmount: eAmt,
                taxableAmount,
                vatAmount,
                receivedStatus,
                receivedDate: receivedDate ? new Date(receivedDate) : null,
                receiptNo,
                remarks,
                travelDate: travelDate ? new Date(travelDate) : null,
                partyVatNo,
                contactNo,
                hsCode,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");

        return { success: true, data: transaction };
    } catch (error: any) {
        console.error("TX Error:", error);
        return { success: false, error: error.message || "Failed to create transaction" };
    }
}

export async function updateTransaction(id: string, formData: any) {
    try {
        const {
            passengerNames,
            partyName,
            sector,
            salesBillNo,
            salesDate,
            salesDateBS,
            purchaseInvoiceNo,
            purchaseDate,
            purchaseDateBS,
            purchaseAmount,
            salesAmount,
            exemptAmount = 0,
            receivedStatus,
            receivedDate,
            receiptNo,
            remarks,
            travelDate,
            partyVatNo,
            contactNo,
            hsCode,
        } = formData;

        const pAmt = parseFloat(purchaseAmount) || 0;
        const sAmt = parseFloat(salesAmount) || 0;
        const eAmt = parseFloat(exemptAmount) || 0;

        const { taxableAmount, vatAmount } = calculateTax(sAmt, eAmt);
        const sDate = salesDate ? new Date(salesDate) : new Date();
        const pDate = purchaseDate ? new Date(purchaseDate) : null;
        const passengerData = typeof passengerNames === 'string' ? passengerNames : JSON.stringify(passengerNames);

        const transaction = await db.transaction.update({
            where: { id },
            data: {
                passengerNames: passengerData,
                partyName,
                sector,
                salesBillNo,
                salesDate: sDate,
                salesDateBS,
                purchaseInvoiceNo,
                purchaseDate: pDate,
                purchaseDateBS,
                purchaseAmount: pAmt,
                salesAmount: sAmt,
                exemptAmount: eAmt,
                taxableAmount,
                vatAmount,
                receivedStatus,
                receivedDate: receivedDate ? new Date(receivedDate) : null,
                receiptNo,
                remarks,
                travelDate: travelDate ? new Date(travelDate) : null,
                partyVatNo,
                contactNo,
                hsCode,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");
        revalidatePath(`/dashboard/tickets/${id}`);

        return { success: true, data: transaction };
    } catch (error: any) {
        console.error("Update TX Error:", error);
        return { success: false, error: error.message || "Failed to update transaction" };
    }
}

export async function deleteTransaction(id: string) {
    try {
        await db.transaction.delete({
            where: { id },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/tickets");

        return { success: true };
    } catch (error: any) {
        console.error("Delete TX Error:", error);
        return { success: false, error: error.message || "Failed to delete transaction" };
    }
}
