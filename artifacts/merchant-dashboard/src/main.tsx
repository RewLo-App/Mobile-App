import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./styles.css";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";
setBaseUrl(apiBase.replace(/\/api\/v1\/?$/, ""));
setAuthTokenGetter(() => localStorage.getItem("rewlo_access_token"));
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } } });

createRoot(document.getElementById("root")!).render(
  <StrictMode><QueryClientProvider client={queryClient}><App /></QueryClientProvider></StrictMode>,
);
