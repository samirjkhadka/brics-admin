export type NepaliDateObject = {
    year: number;
    month: number;
    day: number;
};

export type SajanmNepaliFunctions = {
    AD2BS: (
        ad: string | NepaliDateObject | Date,
        sourceFormat?: string,
        returnFormat?: string
    ) => string | NepaliDateObject | null;
    BS2AD: (
        bs: string | NepaliDateObject,
        sourceFormat?: string,
        returnFormat?: string
    ) => string | NepaliDateObject | null;
    ConvertToDateObject: (value: string, format: string) => NepaliDateObject | null;
    ConvertToDateFormat: (value: NepaliDateObject, format: string) => string;
    BS: {
        GetDaysInMonth: (year: number, month: number) => number;
        GetMonth: (index: number) => string | null;
        GetCurrentDate: (format?: string) => NepaliDateObject | string;
        GetFullDay: (bs: NepaliDateObject, format?: string) => string | null;
        ValidateDate: (bs: NepaliDateObject | string, format?: string) => boolean;
    };
};

declare global {
    interface Window {
        NepaliFunctions?: SajanmNepaliFunctions;
    }
}

export function isNepaliDateObject(value: unknown): value is NepaliDateObject {
    return (
        typeof value === "object" &&
        value !== null &&
        "year" in value &&
        "month" in value &&
        "day" in value
    );
}

export function getClientNepaliFunctions(): SajanmNepaliFunctions {
    if (typeof window === "undefined" || !window.NepaliFunctions) {
        throw new Error("Nepali date library not loaded");
    }
    return window.NepaliFunctions;
}
