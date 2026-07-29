const productionBuild = process.env.EAS_BUILD_PROFILE === "production";
const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

if (productionBuild) {
  if (!apiUrl) {
    throw new Error(
      "Production builds require EXPO_PUBLIC_API_URL. Set it to the public HTTPS API base URL ending in /api/v1.",
    );
  }

  let parsed;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error(
      "EXPO_PUBLIC_API_URL must be a valid absolute URL ending in /api/v1.",
    );
  }

  const pathname = parsed.pathname.replace(/\/+$/, "");
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    !pathname.endsWith("/api/v1")
  ) {
    throw new Error(
      "Production EXPO_PUBLIC_API_URL must be a public HTTPS URL ending in /api/v1, without credentials, query parameters, or a fragment.",
    );
  }
}
