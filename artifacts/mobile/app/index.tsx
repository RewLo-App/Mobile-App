import { Redirect } from "expo-router";
import { useWallet } from "@/context/WalletContext";

export default function Index() {
  const { isOnboarded } = useWallet();
  if (isOnboarded) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/onboarding" />;
}
