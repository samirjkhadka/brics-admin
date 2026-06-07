import {
    peekNextSalesBillNo,
    peekSalesBillNos,
    allocateNextSalesBillNo,
    allocateBillSequences,
} from "@/lib/fiscal-year/service";

export { allocateNextSalesBillNo, allocateBillSequences };

export async function getNextSalesBillNo(): Promise<string> {
    return peekNextSalesBillNo();
}

export async function getPreviewSalesBillNos(count: number): Promise<string[]> {
    return peekSalesBillNos(count);
}
