/** Return a safe client-facing message; log the real error server-side. */
export function publicErrorMessage(
    error: unknown,
    fallback = "An unexpected error occurred. Please try again."
): string {
    if (error instanceof Error) {
        console.error(error);
    } else if (error !== undefined) {
        console.error("Operation failed:", error);
    }
    return fallback;
}
