import db from "@/lib/db";
import { RoleGate } from "@/components/auth/role-gate";
import { Role } from "@prisma/client";
import { formatNPR } from "@/lib/utils/format-currency";
import { startOfMonth, endOfMonth } from "date-fns";
import { Download } from "lucide-react";
import ViewSampleLink from "@/components/reports/view-sample-link";

export default async function VatReportPage({
    searchParams,
}: {
    searchParams: Promise<{ month?: string; year?: string }>;
}) {
    const params = await searchParams;
    const now = new Date();
    const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
    const month = params.month ? parseInt(params.month, 10) : now.getMonth();

    const start = startOfMonth(new Date(year, month, 1));
    const end = endOfMonth(new Date(year, month, 1));

    const transactions = await db.transaction.findMany({
        where: {
            isVoided: false,
            salesDate: { gte: start, lte: end },
        },
    });

    const totals = transactions.reduce(
        (acc, tx) => ({
            sales: acc.sales + Number(tx.salesAmount),
            purchase: acc.purchase + Number(tx.purchaseAmount),
            exempt: acc.exempt + Number(tx.exemptAmount),
            taxable: acc.taxable + Number(tx.taxableAmount),
            vat: acc.vat + Number(tx.vatAmount),
        }),
        { sales: 0, purchase: 0, exempt: 0, taxable: 0, vat: 0 }
    );
    const profit = totals.sales - totals.purchase;

    const monthLabel = start.toLocaleString("default", { month: "long", year: "numeric" });

    return (
        <RoleGate allowed={[Role.SUPERADMIN, Role.ADMIN, Role.VIEWER]}>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">VAT Report</h1>
                        <p className="text-sm text-slate-500">{monthLabel} (excludes voided)</p>
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                        <ViewSampleLink href="/dashboard/reports/vat/sample" />
                        <a
                            href={`/api/export/vat-report?year=${year}&month=${month}`}
                            className="flex items-center gap-2 bg-brand-red text-white px-4 py-2 rounded-lg font-bold text-sm"
                        >
                            <Download size={16} /> Export Excel
                        </a>
                    </div>
                </div>

                <form className="flex gap-3">
                    <select name="month" defaultValue={month} className="border rounded-lg px-3 py-2 text-sm">
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{new Date(2000, i, 1).toLocaleString("default", { month: "long" })}</option>
                        ))}
                    </select>
                    <input type="number" name="year" defaultValue={year} className="border rounded-lg px-3 py-2 text-sm w-24" />
                    <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold">Apply</button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        ["Total Sales", totals.sales],
                        ["Total Purchase", totals.purchase],
                        ["Exempt", totals.exempt],
                        ["Taxable", totals.taxable],
                        ["Output VAT", totals.vat],
                        ["Net Profit", profit],
                    ].map(([label, val]) => (
                        <div key={String(label)} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                            <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
                            <p className="text-xl font-black mt-1">{formatNPR(val as number)}</p>
                        </div>
                    ))}
                </div>

                <p className="text-sm text-slate-500">{transactions.length} transactions in period</p>
            </div>
        </RoleGate>
    );
}
