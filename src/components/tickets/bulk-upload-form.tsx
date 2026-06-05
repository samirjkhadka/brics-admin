"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Download, FileSpreadsheet, Eye, Check } from "lucide-react";
import { parseAndValidateRows } from "@/lib/import/parse-transaction-rows";
import { bulkCreateTransactions } from "@/app/actions/transactions";
import { ButtonWithIcon } from "@/components/ui/button-with-icon";
export default function BulkUploadForm() {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"select" | "preview" | "uploading" | "done">("select");
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [preview, setPreview] = useState<{
        validRows: Record<string, unknown>[];
        errors: { row: number; message: string }[];
        fileName: string;
    } | null>(null);
    const [result, setResult] = useState<{
        created: number;
        failed: number;
        errors: { row: number; message: string }[];
    } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleParse = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;

        setLoading(true);
        setResult(null);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
            const { validRows, errors: parseErrors } = parseAndValidateRows(rawRows);

            setPreview({
                validRows,
                errors: parseErrors,
                fileName: file.name,
            });
            setStep("preview");
        } catch {
            setResult({
                created: 0,
                failed: 1,
                errors: [{ row: 0, message: "Failed to read spreadsheet file" }],
            });
            setStep("done");
        }

        setLoading(false);
    };

    const handleConfirm = async () => {
        if (!preview || preview.validRows.length === 0) return;

        const total = preview.validRows.length;
        setLoading(true);
        setStep("uploading");
        setUploadProgress({ current: 0, total });

        let created = 0;
        const uploadErrors: { row: number; message: string }[] = [];

        for (let i = 0; i < total; i++) {
            const res = await bulkCreateTransactions([preview.validRows[i]], {
                revalidate: i === total - 1,
                startRowIndex: i,
            });

            if (!res.success) {
                uploadErrors.push({ row: i + 2, message: res.error || "Upload failed" });
            } else {
                created += res.created || 0;
                if (res.errors?.length) uploadErrors.push(...res.errors);
            }

            setUploadProgress({ current: i + 1, total });
        }

        setResult({
            created,
            failed: uploadErrors.length + preview.errors.length,
            errors: [...preview.errors, ...uploadErrors],
        });

        setStep("done");
        setPreview(null);
        setUploadProgress({ current: 0, total: 0 });
        if (fileRef.current) fileRef.current.value = "";
        setLoading(false);
    };

    const reset = () => {
        setStep("select");
        setPreview(null);
        setResult(null);
        setUploadProgress({ current: 0, total: 0 });
        if (fileRef.current) fileRef.current.value = "";
    };

    const progressPercent =
        uploadProgress.total > 0
            ? Math.round((uploadProgress.current / uploadProgress.total) * 100)
            : 0;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
                <FileSpreadsheet size={20} className="text-brand-red" />
                <h2 className="text-lg font-black text-slate-900">Bulk Excel Upload</h2>
            </div>
            <p className="text-sm text-slate-500">
                Upload an Excel (.xlsx) or CSV file matching the BRICS spreadsheet layout. Preview rows before creating.
            </p>

            {step === "select" && (
                <div className="flex flex-wrap gap-3 items-center">
                    <a
                        href="/api/import/transaction-template"
                        className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                        <Download size={16} /> Download Template
                    </a>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:font-semibold"
                    />
                    <ButtonWithIcon
                        type="button"
                        icon={Eye}
                        onClick={handleParse}
                        disabled={loading}
                        className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                    >
                        {loading ? "Parsing..." : "Preview"}
                    </ButtonWithIcon>
                </div>
            )}

            {step === "preview" && preview && (
                <div className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm font-bold">
                        <span className="text-slate-600">File: {preview.fileName}</span>
                        <span className="text-emerald-600">Valid: {preview.validRows.length}</span>
                        <span className="text-red-600">Invalid: {preview.errors.length}</span>
                    </div>

                    {preview.validRows.length > 0 && (
                        <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-64">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase">
                                        <th className="px-3 py-2 text-left">#</th>
                                        <th className="px-3 py-2 text-left">Party</th>
                                        <th className="px-3 py-2 text-left">Sector</th>
                                        <th className="px-3 py-2 text-right">Sales</th>
                                        <th className="px-3 py-2 text-left">Sales Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {preview.validRows.slice(0, 20).map((row, i) => (
                                        <tr key={i}>
                                            <td className="px-3 py-2">{i + 1}</td>
                                            <td className="px-3 py-2">{String(row.partyName ?? "")}</td>
                                            <td className="px-3 py-2">{String(row.sector ?? "")}</td>
                                            <td className="px-3 py-2 text-right font-mono">{String(row.salesAmount ?? "")}</td>
                                            <td className="px-3 py-2">{String(row.salesDate ?? "")}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.validRows.length > 20 && (
                                <p className="text-xs text-slate-400 p-2">…and {preview.validRows.length - 20} more rows</p>
                            )}
                        </div>
                    )}

                    {preview.errors.length > 0 && (
                        <ul className="text-xs text-red-600 space-y-1 max-h-32 overflow-y-auto border border-red-100 rounded-lg p-3 bg-red-50">
                            {preview.errors.map((e, i) => (
                                <li key={i}>
                                    Row {e.row}: {e.message}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={reset}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold text-sm"
                        >
                            Cancel
                        </button>
                        <ButtonWithIcon
                            type="button"
                            icon={Check}
                            onClick={handleConfirm}
                            disabled={loading || preview.validRows.length === 0}
                            className="bg-brand-red hover:bg-brand-red-dark text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50"
                        >
                            {loading ? "Creating..." : `Confirm & Create (${preview.validRows.length})`}
                        </ButtonWithIcon>
                    </div>
                </div>
            )}

            {step === "uploading" && uploadProgress.total > 0 && (
                <div className="space-y-3 rounded-xl border border-brand-red/20 bg-brand-red/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-slate-800">
                        <span>Creating bills…</span>
                        <span className="tabular-nums text-brand-red">
                            {uploadProgress.current}/{uploadProgress.total} ({progressPercent}%)
                        </span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-white border border-slate-200 overflow-hidden">
                        <div
                            className="h-full bg-brand-red transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500">
                        Please keep this page open until the upload completes.
                    </p>
                </div>
            )}

            {step === "done" && result && (
                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                        Created: <span className="text-emerald-600">{result.created}</span> | Failed:{" "}
                        <span className="text-red-600">{result.failed}</span>
                    </p>
                    {result.errors.length > 0 && (
                        <ul className="text-xs text-red-600 space-y-1 max-h-40 overflow-y-auto">
                            {result.errors.map((e, i) => (
                                <li key={i}>
                                    Row {e.row}: {e.message}
                                </li>
                            ))}
                        </ul>
                    )}
                    <button
                        type="button"
                        onClick={reset}
                        className="text-sm font-bold text-brand-red hover:underline"
                    >
                        Upload another file
                    </button>
                </div>
            )}
        </div>
    );
}
