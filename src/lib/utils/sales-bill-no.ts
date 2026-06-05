import { peekNextSalesBillNo, allocateNextSalesBillNo } from "@/lib/fiscal-year/service";

export { allocateNextSalesBillNo };

export async function getNextSalesBillNo(): Promise<string> {
    return peekNextSalesBillNo();
}
