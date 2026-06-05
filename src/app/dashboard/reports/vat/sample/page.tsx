import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import SamplePageShell from "@/components/reports/sample-page-shell";
import { SAMPLE_VAT_REPORT } from "@/lib/reports/sample-data";
import { formatNPR } from "@/lib/utils/format-currency";

export default function VatReportSamplePage() {
    const sample = SAMPLE_VAT_REPORT;

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <SamplePageShell title="VAT Report" backHref="/dashboard/reports/vat">
                <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-10 shadow-lg print:shadow-none font-serif">
                    <div className="text-center mb-8">
                        <h1 className="text-lg font-bold">BRICS WORLD TRAVEL AND TOURS Pvt. Ltd.</h1>
                        <p className="text-sm">Kirtipur, Kathmandu, Nepal</p>
                        <h2 className="text-sm font-black mt-4 uppercase">Monthly VAT Report</h2>
                        <p className="text-sm mt-2">{sample.monthLabel}</p>
                    </div>

                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-slate-200">
                            {[
                                ["Total Sales", sample.totals.sales],
                                ["Total Purchase", sample.totals.purchase],
                                ["Exempt Amount", sample.totals.exempt],
                                ["Taxable Amount", sample.totals.taxable],
                                ["Output VAT (13%)", sample.totals.vat],
                                ["Net Profit", sample.totals.profit],
                            ].map(([label, value]) => (
                                <tr key={String(label)}>
                                    <td className="py-3 font-medium text-slate-600">{label}</td>
                                    <td className="py-3 text-right font-mono font-bold">{formatNPR(value as number)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <p className="text-xs text-slate-500 mt-8 text-center">
                        Based on {sample.transactions} non-voided transactions in the period.
                    </p>
                </div>
            </SamplePageShell>
        </RoleGate>
    );
}
