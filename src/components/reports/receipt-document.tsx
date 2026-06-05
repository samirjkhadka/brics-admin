import { formatNPR } from "@/lib/utils/format-currency";
import { numberToWords } from "@/lib/utils/number-to-words";

export type ReceiptDocumentData = {
    receiptNo: string;
    receiptDateAD: string;
    receiptDateBS?: string;
    partyName: string;
    amount: number;
    paymentMethod: string;
    chequeNo?: string | null;
    bankName?: string | null;
    travelDate?: string | null;
    sector?: string | null;
    billNo?: string | null;
};

function paymentLabel(method: string): string {
    if (method === "CHEQUE") return "cheque";
    if (method === "CASH") return "cash";
    if (method === "BANK" || method === "QR") return "Online";
    return method.toLowerCase();
}

export default function ReceiptDocument({
    data,
    isSample = false,
}: {
    data: ReceiptDocumentData;
    isSample?: boolean;
}) {
    const amountWords = numberToWords(Math.round(data.amount * 100) / 100);
    const payVia = paymentLabel(data.paymentMethod);

    return (
        <div className="max-w-[700px] mx-auto bg-white border border-slate-200 shadow-xl p-10 font-serif text-black text-sm print:shadow-none print:border-0 relative">
            {isSample && (
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-1 rounded print:hidden">
                    Sample
                </div>
            )}

            <div className="text-center mb-8">
                <h1 className="text-base font-bold tracking-wide uppercase">
                    BRICS WORLD TRAVEL AND TOURS PVT LTD
                </h1>
                <p className="text-sm mt-1">Kirtipur, Kathmandu, Nepal</p>
                <h2 className="text-sm font-black mt-4 uppercase tracking-widest">Receipt</h2>
            </div>

            <div className="flex justify-between mb-6 text-sm">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Date:</span>
                    <span className="border-b border-black min-w-[120px] inline-block font-semibold">
                        &nbsp;{data.receiptDateAD}&nbsp;
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-medium">R. No.</span>
                    <span className="border-b border-black min-w-[100px] inline-block font-mono font-bold">
                        &nbsp;{data.receiptNo}&nbsp;
                    </span>
                </div>
            </div>

            <div className="space-y-1 leading-8">
                <p>
                    Received with Thanks from M/s{" "}
                    <span className="inline-block border-b border-black min-w-[320px] align-bottom font-bold">
                        &nbsp;{data.partyName}&nbsp;
                    </span>
                </p>
                <p>
                    the sum of Rupees (in words){" "}
                    <span className="inline-block border-b border-black min-w-[400px] align-bottom italic">
                        &nbsp;{amountWords}&nbsp;
                    </span>
                </p>
                <p>
                    by {payVia}
                    {data.paymentMethod === "CHEQUE" && (
                        <>
                            {" "}
                            Ref No
                            <span className="inline-block border-b border-black min-w-[120px] align-bottom mx-1 font-semibold">
                                &nbsp;{data.chequeNo || "—"}&nbsp;
                            </span>
                        </>
                    )}
                    {" "}
                    dated{" "}
                    <span className="inline-block border-b border-black min-w-[100px] align-bottom font-semibold">
                        &nbsp;{data.receiptDateAD}&nbsp;
                    </span>
                </p>
                <p>
                    for Travel Date{" "}
                    <span className="inline-block border-b border-black min-w-[100px] align-bottom">
                        &nbsp;{data.travelDate || "—"}&nbsp;
                    </span>
                    sector{" "}
                    <span className="inline-block border-b border-black min-w-[160px] align-bottom font-semibold">
                        &nbsp;{data.sector || "—"}&nbsp;
                    </span>
                </p>
                {data.paymentMethod === "CHEQUE" && (
                    <p>
                        drawn on Bank{" "}
                        <span className="inline-block border-b border-black min-w-[200px] align-bottom">
                            &nbsp;{data.bankName || "—"}&nbsp;
                        </span>
                        {" "}in payment our account.
                    </p>
                )}
                <p className="pt-4">
                    Rs{" "}
                    <span className="inline-block border-b border-black min-w-[200px] align-bottom text-lg font-black">
                        &nbsp;{formatNPR(data.amount)}&nbsp;
                    </span>
                </p>
            </div>

            <p className="mt-16 text-right font-bold uppercase text-sm">
                For BRICS TRAVEL AND TOURS PVT. LTD
            </p>
        </div>
    );
}
