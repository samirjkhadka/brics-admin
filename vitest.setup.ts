import { getServerNepaliFunctions } from "./src/lib/nepali/sajanm-server";

Object.defineProperty(globalThis, "window", {
    value: {
        NepaliFunctions: getServerNepaliFunctions(),
    },
    writable: true,
});
