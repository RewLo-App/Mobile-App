import { customFetch } from "@workspace/api-client-react";

// Keep the screen recoverable if the backend never answers. This exceeds the
// server's per-Brale-call deadline, including one safe read retry.
const WALLET_REQUEST_TIMEOUT_MS = 30_000;

/** Returns a concise API message suitable for the app UI, without HTTP status text. */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
      return data.error;
    }
  }
  if (error instanceof Error) {
    return error.message.replace(/^HTTP\s+\d+\s+[^:]+:\s*/i, "") || fallback;
  }
  return fallback;
}

export async function walletRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WALLET_REQUEST_TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  init.signal?.addEventListener("abort", abortFromCaller, { once: true });

  try {
    return await customFetch<T>(path, {
      ...init,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...init.headers },
      responseType: "json",
    });
  } catch (error) {
    if (controller.signal.aborted && !init.signal?.aborted) {
      throw new Error("The request took too long. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abortFromCaller);
  }
}
