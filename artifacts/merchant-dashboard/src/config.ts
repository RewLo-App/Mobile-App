const defaultApiUrl = import.meta.env.PROD
  ? "/api/v1"
  : "http://localhost:3001/api/v1";

export const API_URL = (
  import.meta.env.VITE_API_URL || defaultApiUrl
).replace(/\/+$/, "");

const configuredBasePath = import.meta.env.BASE_URL.replace(/\/+$/, "");

export function merchantPath(segment = "") {
  const normalizedSegment = segment.replace(/^\/+|\/+$/g, "");
  const basePath = configuredBasePath || "";

  if (!normalizedSegment) {
    return basePath || "/";
  }

  return `${basePath}/${normalizedSegment}`;
}
