import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : "";

export async function walletRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const userId = await AsyncStorage.getItem("rewlo_user_id");
  if (!userId) throw new Error("Please sign in again to use your wallet");
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Rewlo-User-Id": userId, ...init.headers },
  });
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "Wallet request failed");
  return body;
}
