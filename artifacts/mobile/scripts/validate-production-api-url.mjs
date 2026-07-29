const productionBuild = process.env.EAS_BUILD_PROFILE === "production";
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

if (productionBuild && (!apiUrl || !/^https:\/\/[^/]+/i.test(apiUrl))) {
  throw new Error(
    "Production builds require EXPO_PUBLIC_API_URL to be a public HTTPS URL. Set it in the EAS production environment before building.",
  );
}
