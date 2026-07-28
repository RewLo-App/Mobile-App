export * from "./generated/api";
export * from "./generated/api.schemas";
export {
  customFetch,
  setBaseUrl,
  setAuthTokenGetter,
  setAuthRefreshHandler,
} from "./custom-fetch";
export type { AuthTokenGetter, AuthRefreshHandler } from "./custom-fetch";
export { QueryClient, QueryClientProvider } from "@tanstack/react-query";
