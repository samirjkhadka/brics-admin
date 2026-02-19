import NepaliDate from "nepali-date-converter";

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

/**
 * Converts BS date (YYYY-MM-DD or YYYY/MM/DD) to JS Date (AD)
 */
export const bsToAd = (bsDateStr: string): Date => {
    try {
        const nepaliDate = new NepaliDate(bsDateStr);
        return nepaliDate.toJsDate();
    } catch (error) {
        console.error("Date conversion error:", error);
        return new Date();
    }
};

/**
 * Converts JS Date (AD) to BS date string (YYYY-MM-DD)
 */
export const adToBs = (adDate: Date): string => {
    const nepaliDate = new NepaliDate(adDate);
    return nepaliDate.format("YYYY-MM-DD");
};
