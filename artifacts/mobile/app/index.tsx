import { Redirect } from "expo-router";
import { useWallet } from "@/context/WalletContext";

export default function Index() {
  const { isAuthenticated, isOnboarded, isRestoringSession } = useWallet();
  if (isRestoringSession) return null;
  if (isAuthenticated || isOnboarded) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/onboarding" />;
}
