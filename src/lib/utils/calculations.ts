/**
 * Calculates VAT and Taxable amounts based on the formula:
 * Taxable = ((Sales - Exempt) * 100) / 113
 * VAT = Taxable * 0.13
 */
export const calculateTax = (salesAmount: number, exemptAmount: number = 0) => {
    const taxableAmount = ((salesAmount - exemptAmount) * 100) / 113;
    const vatAmount = taxableAmount * 0.13;

    return {
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        vatAmount: parseFloat(vatAmount.toFixed(2)),
    };
};
