import db from "@/lib/db";

export async function expandTransactionIdsWithBookingGroups(
    transactionIds: string[]
): Promise<string[]> {
    const selected = await db.transaction.findMany({
        where: { id: { in: transactionIds } },
        select: { id: true, bookingGroupId: true },
    });

    const groupIds = [
        ...new Set(
            selected.map((t) => t.bookingGroupId).filter((id): id is string => Boolean(id))
        ),
    ];

    if (groupIds.length === 0) return [...new Set(transactionIds)];

    const linked = await db.transaction.findMany({
        where: { bookingGroupId: { in: groupIds } },
        select: { id: true },
    });

    return [...new Set([...transactionIds, ...linked.map((t) => t.id)])];
}

export async function getLinkedTransactions(transactionId: string) {
    const tx = await db.transaction.findUnique({
        where: { id: transactionId },
        select: { bookingGroupId: true, billingMode: true },
    });
    if (!tx?.bookingGroupId) return [];

    return db.transaction.findMany({
        where: { bookingGroupId: tx.bookingGroupId },
        orderBy: [{ billSequence: "desc" }, { salesBillNo: "desc" }],
        include: { purchaseLegs: { orderBy: { legIndex: "asc" } } },
    });
}
