import { Prisma } from "@prisma/client";

export function toDecimal(value: number | string): Prisma.Decimal {
    return new Prisma.Decimal(value);
}
