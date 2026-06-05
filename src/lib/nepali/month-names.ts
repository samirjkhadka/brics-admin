export const BS_MONTH_NAMES = [
    "Baisakh",
    "Jestha",
    "Ashadh",
    "Shrawan",
    "Bhadra",
    "Ashwin",
    "Kartik",
    "Mangsir",
    "Poush",
    "Magh",
    "Falgun",
    "Chaitra",
];

export function getBsMonthName(month: number): string {
    return BS_MONTH_NAMES[month - 1] || "";
}
