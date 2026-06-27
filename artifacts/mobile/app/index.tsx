import { Redirect } from "expo-router";
import { useWallet } from "@/context/WalletContext";

export default function Index() {
  const { isAuthenticated } = useWallet();
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href="/login" />;
}
