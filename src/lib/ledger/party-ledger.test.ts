import { describe, it, expect } from "vitest";
import { computeClosingBalance, computePartyTotalReceived } from "./party-ledger";

describe("party-ledger", () => {
    it("computes closing = opening + billed - received", () => {
        expect(computeClosingBalance(1000, 5000, 3000)).toBe(3000);
        expect(computeClosingBalance(0, 10000, 10000)).toBe(0);
        expect(computeClosingBalance(-500, 2000, 1000)).toBe(500);
    });

    it("excludes voided conceptually via zero billed", () => {
        expect(computeClosingBalance(1000, 0, 500)).toBe(500);
    });

    it("counts receipt records and unlinked transaction payments", () => {
        const received = computePartyTotalReceived(
            "Acme Travel",
            [
                { id: "tx1", partyName: "Acme Travel", amountReceived: 5000 },
                { id: "tx2", partyName: "Acme Travel", amountReceived: 2000 },
            ],
            [
                {
                    partyName: "Acme Travel",
                    amount: 5000,
                    allocations: [{ transactionId: "tx1" }],
                },
            ]
        );
        expect(received).toBe(7000);
    });

    it("subtracts customer cash refunds from received", () => {
        const received = computePartyTotalReceived(
            "Acme Travel",
            [{ id: "tx1", partyName: "Acme Travel", amountReceived: 5000 }],
            [],
            [{ partyName: "Acme Travel", customerCashAmount: 2000 }]
        );
        expect(received).toBe(3000);
    });
});
