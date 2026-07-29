export const API_VERSION_PATH = "/api/v1";

function normalizeApiBaseUrl(value: string | undefined): string {
  const configuredUrl = value?.trim();

  if (!configuredUrl) {
    throw new Error(
      "EXPO_PUBLIC_API_URL is required. Set it to an absolute API URL ending in /api/v1, such as http://localhost:3000/api/v1 for local development.",
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be a valid absolute HTTP(S) URL ending in /api/v1.",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("EXPO_PUBLIC_API_URL must use the http or https protocol.");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error(
      "EXPO_PUBLIC_API_URL must not include credentials, query parameters, or a fragment.",
    );
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (!pathname.endsWith(API_VERSION_PATH)) {
    throw new Error("EXPO_PUBLIC_API_URL must end in /api/v1.");
  }
  if (
    process.env.EXPO_PUBLIC_APP_ENV === "production" &&
    parsed.protocol !== "https:"
  ) {
    throw new Error(
      "Production EXPO_PUBLIC_API_URL must use the https protocol.",
    );
  }

  parsed.pathname = pathname;
  return parsed.toString().replace(/\/+$/, "");
}

/** The one normalized base used by every mobile API transport. */
export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_API_URL,
);

/** Generated endpoints already include API_VERSION_PATH and need only the origin. */
export function getApiOrigin(apiBaseUrl = API_BASE_URL): string {
  return apiBaseUrl.slice(0, -API_VERSION_PATH.length);
}

/** Normalize legacy manual `/api/*` paths for the shared generated transport. */
export function toVersionedApiPath(path: string): string {
  if (path === API_VERSION_PATH || path.startsWith(`${API_VERSION_PATH}/`)) {
    return path;
  }
  if (path === "/api") return API_VERSION_PATH;
  if (path.startsWith("/api/")) {
    return `${API_VERSION_PATH}/${path.slice("/api/".length)}`;
  }
  if (path.startsWith("/")) return `${API_VERSION_PATH}${path}`;

  throw new Error(`API request paths must start with "/": ${path}`);
}
