import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import {
  forgotPassword as requestPasswordReset,
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  refreshSession as apiRefreshSession,
  resetPassword as submitPasswordReset,
  setAuthRefreshHandler,
  setAuthTokenGetter,
  setBaseUrl,
} from "@workspace/api-client-react";
import type { CurrentUser, RegisterRequest } from "@workspace/api-client-react";

const ACCESS_TOKEN_KEY = "rewlo_access_token";
const REFRESH_TOKEN_KEY = "rewlo_refresh_token";

export class FanAccountRequiredError extends Error {
  readonly name = "FanAccountRequiredError";

  constructor() {
    super("This account is registered for the Merchant dashboard. Sign in with a Fan account.");
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

function apiOrigin(value: string | undefined): string | null {
  const normalized = value?.trim().replace(/\/+$/, "");
  if (!normalized) return null;
  // Generated client paths already begin with /api/v1. Accept an accidentally
  // versioned environment value without producing /api/v1/api/v1.
  return normalized.replace(/\/api\/v1$/i, "");
}

// Production builds receive this from the EAS "production" environment. Do
// not add a localhost fallback here: a released iOS app cannot reach it.
const API_BASE = apiOrigin(process.env.EXPO_PUBLIC_API_URL)
  ?? apiOrigin(process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : undefined);

if (process.env.EXPO_PUBLIC_APP_ENV === "production" && (!API_BASE || !API_BASE.startsWith("https://"))) {
  throw new Error("A secure EXPO_PUBLIC_API_URL is required for production builds.");
}

// expo-secure-store is native-only in this setup. On web, use the browser's
// storage so registration and session restoration can still make API calls.
async function getSessionValue(key: string): Promise<string | null> {
  if (Platform.OS === "web") return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setSessionValue(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeSessionValue(key: string): Promise<void> {
  if (Platform.OS === "web") {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

let configured = false;
let refreshInFlight: Promise<boolean> | null = null;
let sessionExpiredHandler: (() => void | Promise<void>) | null = null;

export function setSessionExpiredHandler(handler: (() => void | Promise<void>) | null) {
  sessionExpiredHandler = handler;
}

/** Configure the generated API client to use the app API and secure bearer token. */
export function configureAuthClient() {
  if (configured) return;
  setBaseUrl(API_BASE);
  setAuthTokenGetter(() => getSessionValue(ACCESS_TOKEN_KEY));
  setAuthRefreshHandler(refreshAuthSession);
  configured = true;
}

export async function saveAuthTokens(accessToken: string, refreshToken: string) {
  await Promise.all([
    setSessionValue(ACCESS_TOKEN_KEY, accessToken),
    setSessionValue(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearAuthTokens() {
  await Promise.all([
    removeSessionValue(ACCESS_TOKEN_KEY),
    removeSessionValue(REFRESH_TOKEN_KEY),
  ]);
}

function getStatus(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("status" in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
}

export async function refreshAuthSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const refreshToken = await getSessionValue(REFRESH_TOKEN_KEY);
      if (!refreshToken) return false;
      const response = await apiRefreshSession({ refreshToken });
      await saveAuthTokens(response.tokens.accessToken, response.tokens.refreshToken);
      return true;
    } catch {
      await clearAuthTokens();
      await sessionExpiredHandler?.();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function loadCurrentUser(): Promise<CurrentUser> {
  configureAuthClient();
  const currentUser = await getCurrentUser();
  if (currentUser.role !== "Fan") {
    // A shared authentication endpoint serves both products. Never retain a
    // valid Merchant session inside the Fan mobile application.
    await logoutSession();
    throw new FanAccountRequiredError();
  }
  return currentUser;
}

export async function loginWithPassword(email: string, password: string): Promise<CurrentUser> {
  configureAuthClient();
  const response = await apiLogin({ email: email.trim(), password });
  await saveAuthTokens(response.tokens.accessToken, response.tokens.refreshToken);
  return loadCurrentUser();
}

export async function registerAccount(request: RegisterRequest): Promise<CurrentUser> {
  configureAuthClient();
  const response = await apiRegister(request);
  await saveAuthTokens(response.tokens.accessToken, response.tokens.refreshToken);
  return loadCurrentUser();
}

export async function restoreAuthSession(): Promise<CurrentUser | null> {
  configureAuthClient();
  const refreshToken = await getSessionValue(REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;

  try {
    return await loadCurrentUser();
  } catch (error) {
    // Keep a valid local session during a transient network failure. Only an
    // unauthorized response is eligible for refresh or credential clearing.
    if (getStatus(error) !== 401) throw error;
    if (!await refreshAuthSession()) return null;
    try {
      return await loadCurrentUser();
    } catch {
      await clearAuthTokens();
      return null;
    }
  }
}

export async function logoutSession() {
  configureAuthClient();
  const [refreshToken, accessToken] = await Promise.all([
    getSessionValue(REFRESH_TOKEN_KEY),
    getSessionValue(ACCESS_TOKEN_KEY),
  ]);
  // Local logout must never depend on the network. Clear credentials before
  // attempting best-effort server-side refresh-token revocation.
  await clearAuthTokens();
  try {
    if (refreshToken) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3_000);
      try {
        await apiLogout({ refreshToken }, {
          signal: controller.signal,
          // The API requires the current access token to revoke this refresh
          // token. Preserve it only in memory for this one request.
          headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        });
      } finally {
        clearTimeout(timeout);
      }
    }
  } catch {
    // Clear local credentials even when the device is offline or the session
    // has already expired. No tokens or passwords are logged.
  }
}

export async function forgotPassword(email: string) {
  configureAuthClient();
  return requestPasswordReset({ email: email.trim() });
}

export async function resetPassword(token: string, newPassword: string) {
  configureAuthClient();
  return submitPasswordReset({ token, newPassword });
}
