import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await login(email, password);
    setLoading(false);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)/home");
    } else {
      setError("Invalid credentials. Please try again.");
    }
  };

  const fillDemo = () => {
    setEmail("alex@rewlo.io");
    setPassword("password123");
    setError("");
  };

  return (
    <LinearGradient colors={["#020D1E", "#041828", "#062040"]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View
          style={[
            styles.container,
            {
              paddingTop: Platform.OS === "web" ? 67 : insets.top + 20,
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoText}>R</Text>
            </View>
            <Text style={styles.brand}>Rewlo</Text>
            <Text style={styles.tagline}>Your Sports Fan Wallet</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.welcomeText, { color: colors.foreground }]}>
              Welcome back
            </Text>
            <Text style={[styles.subText, { color: colors.mutedForeground }]}>
              Sign in to your account
            </Text>

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="mail-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Email address"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Ionicons name="lock-closed-outline" size={20} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>

            {error.length > 0 && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            )}

            <Pressable
              onPress={handleLogin}
              disabled={loading}
              style={({ pressed }) => [
                styles.loginBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Sign In</Text>
              )}
            </Pressable>

            <Pressable onPress={fillDemo} style={styles.demoBtn}>
              <Text style={[styles.demoBtnText, { color: colors.mutedForeground }]}>
                Use demo account
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.securityRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
                Secured by stablecoin rails · USDC powered
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
  },
  brand: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: "#6B8BAE",
    marginTop: 6,
    fontFamily: "Inter_400Regular",
  },
  form: {
    gap: 14,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  subText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  loginBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  demoBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  demoBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    alignItems: "center",
    paddingBottom: 10,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  securityText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
