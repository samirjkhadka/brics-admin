import fs from "fs";
import path from "path";
import vm from "vm";
import type { SajanmNepaliFunctions } from "./sajanm-functions";

let serverCache: SajanmNepaliFunctions | null = null;

function loadFromBundle(): SajanmNepaliFunctions {
    const jsPath = path.join(
        process.cwd(),
        "node_modules/@sajanm/nepali-date-picker/dist/nepali.datepicker.v5.0.6.min.js"
    );
    const full = fs.readFileSync(jsPath, "utf8");
    const nfOnly = `${full.split(";var NepaliDatePicker=")[0]};`;
    const mod = { exports: {} as SajanmNepaliFunctions };
    vm.runInNewContext(nfOnly, { module: mod });
    return mod.exports;
}

export function getServerNepaliFunctions(): SajanmNepaliFunctions {
    if (!serverCache) {
        serverCache = loadFromBundle();
    }
    return serverCache;
}
