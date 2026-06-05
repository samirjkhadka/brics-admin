import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import SamplePageShell from "@/components/reports/sample-page-shell";
import { SAMPLE_CUSTOMER_STATEMENT, SAMPLE_SUPPLIER_STATEMENT } from "@/lib/reports/sample-data";
import { formatNPR } from "@/lib/utils/format-currency";

export default function StatementsSamplePage() {
    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <SamplePageShell title="Statements" backHref="/dashboard/reports/statements">
                <div className="max-w-3xl mx-auto space-y-10">
                    <section className="bg-white border border-slate-200 p-8 shadow-lg print:shadow-none font-serif">
                        <div className="text-center mb-6">
                            <h1 className="text-lg font-bold">BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.</h1>
                            <h2 className="text-sm font-black mt-3 uppercase">Customer Statement</h2>
                            <p className="text-sm mt-1">FY {SAMPLE_CUSTOMER_STATEMENT.fyLabel}</p>
                        </div>
                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-3 py-2 text-left">Customer</th>
                                    <th className="border border-slate-300 px-3 py-2 text-right">Billed</th>
                                    <th className="border border-slate-300 px-3 py-2 text-right">Received</th>
                                    <th className="border border-slate-300 px-3 py-2 text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SAMPLE_CUSTOMER_STATEMENT.rows.map((row) => (
                                    <tr key={row.partyName}>
                                        <td className="border border-slate-300 px-3 py-2 font-semibold">{row.partyName}</td>
                                        <td className="border border-slate-300 px-3 py-2 text-right font-mono">{formatNPR(row.billed)}</td>
                                        <td className="border border-slate-300 px-3 py-2 text-right font-mono">{formatNPR(row.received)}</td>
                                        <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">{formatNPR(row.balance)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    <section className="bg-white border border-slate-200 p-8 shadow-lg print:shadow-none font-serif">
                        <div className="text-center mb-6">
                            <h1 className="text-lg font-bold">BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.</h1>
                            <h2 className="text-sm font-black mt-3 uppercase">Supplier Statement</h2>
                            <p className="text-sm mt-1">FY {SAMPLE_SUPPLIER_STATEMENT.fyLabel}</p>
                        </div>
                        <table className="w-full text-sm border-collapse border border-slate-300">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 px-3 py-2 text-left">Supplier</th>
                                    <th className="border border-slate-300 px-3 py-2 text-right">Bills</th>
                                    <th className="border border-slate-300 px-3 py-2 text-right">Purchase Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {SAMPLE_SUPPLIER_STATEMENT.rows.map((row) => (
                                    <tr key={row.supplierName}>
                                        <td className="border border-slate-300 px-3 py-2 font-semibold">{row.supplierName}</td>
                                        <td className="border border-slate-300 px-3 py-2 text-right">{row.count}</td>
                                        <td className="border border-slate-300 px-3 py-2 text-right font-mono font-bold">{formatNPR(row.purchase)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                </div>
            </SamplePageShell>
        </RoleGate>
    );
}
