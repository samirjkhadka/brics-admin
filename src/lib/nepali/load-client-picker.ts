const SCRIPT_ID = "sajanm-nepali-datepicker-script";
const CSS_ID = "sajanm-nepali-datepicker-css";
const SCRIPT_SRC = "/vendor/nepali-date-picker/nepali.datepicker.v5.0.6.min.js";
const CSS_HREF = "/vendor/nepali-date-picker/nepali.datepicker.v5.0.6.min.css";

let loadPromise: Promise<void> | null = null;

export function loadSajanmDatePickerAssets(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.resolve();
    }
    if (window.NepaliFunctions) {
        return Promise.resolve();
    }
    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
        if (!document.getElementById(CSS_ID)) {
            const link = document.createElement("link");
            link.id = CSS_ID;
            link.rel = "stylesheet";
            link.href = CSS_HREF;
            document.head.appendChild(link);
        }

        const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (existing) {
            if (window.NepaliFunctions) {
                resolve();
                return;
            }
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("Failed to load Nepali date picker")));
            return;
        }

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Nepali date picker"));
        document.body.appendChild(script);
    });

    return loadPromise;
}

export type NepaliPickerSelectPayload = {
    value: string;
    year: number;
    month: number;
    day: number;
};

type NepaliDatePickerOptions = {
    dateFormat?: string;
    language?: string;
    miniEnglishDates?: boolean;
    value?: string | null;
    onSelect?: (selected: NepaliPickerSelectPayload) => void;
};

interface NepaliPickerInput extends HTMLInputElement {
    nepaliDatePicker?: (options?: NepaliDatePickerOptions | "destroy") => unknown;
    _ndpHandlers?: unknown;
}

export async function attachSajanmDatePicker(
    input: HTMLInputElement,
    options: NepaliDatePickerOptions
): Promise<() => void> {
    await loadSajanmDatePickerAssets();
    const el = input as NepaliPickerInput;
    el.nepaliDatePicker?.("destroy");
    el.nepaliDatePicker?.({
        dateFormat: "YYYY-MM-DD",
        language: "english",
        miniEnglishDates: true,
        ...options,
    });
    return () => {
        el.nepaliDatePicker?.("destroy");
    };
}
