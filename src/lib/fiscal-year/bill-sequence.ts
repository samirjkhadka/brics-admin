/**
 * Find the lowest available bill sequence numbers in a fiscal year.
 * Voided transactions remain in the DB and keep their sequence.
 * Deleted transactions free their sequence for reuse.
 */
export function findNextAvailableBillSequences(
    usedSequences: Iterable<number>,
    count = 1
): number[] {
    const used = new Set(usedSequences);
    const result: number[] = [];
    let candidate = used.size === 0 ? 1 : Math.min(...used);

    while (result.length < count) {
        while (used.has(candidate)) {
            candidate++;
        }
        result.push(candidate);
        used.add(candidate);
        candidate++;
    }

    return result;
}

export function findNextAvailableBillSequence(usedSequences: Iterable<number>): number {
    return findNextAvailableBillSequences(usedSequences, 1)[0];
}
