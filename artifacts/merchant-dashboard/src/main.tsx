import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import { API_URL } from "./config";
import "./styles.css";
import "./auth.css";
import "./issuance.css";
import "./transfers.css";

setBaseUrl(API_URL.replace(/\/api\/v1\/?$/, ""));
setAuthTokenGetter(() => localStorage.getItem("rewlo_access_token"));
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>,
);
