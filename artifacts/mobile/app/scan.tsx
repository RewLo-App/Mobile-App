import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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

const SCREEN_W = Dimensions.get("window").width;
const SCAN_SIZE = SCREEN_W * 0.72;

const DEMO_QR_PAYLOADS = [
  { merchant: "Etihad Stadium Catering", amount: 12.5, ref: "STQR-4821" },
  { merchant: "MCFC Official Store", amount: 38.0, ref: "SHQR-7743" },
  { merchant: "Jordan Thompson", amount: 25.0, ref: "P2P-2291", isP2P: true },
  { merchant: "Nike Stadium Pop-Up", amount: 64.99, ref: "NKQR-0056" },
];

interface PaymentPayload {
  merchant: string;
  amount: number;
  ref: string;
  isP2P?: boolean;
}

type ScanPhase = "scanning" | "confirming" | "success";

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, balance } = useWallet();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<ScanPhase>("scanning");
  const [payload, setPayload] = useState<PaymentPayload | null>(null);
  const [manualAmount, setManualAmount] = useState("");
  const [showManual, setShowManual] = useState(false);
  const scanned = useRef(false);
  const successScale = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned.current) return;
    scanned.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const randomPayload = DEMO_QR_PAYLOADS[Math.floor(Math.random() * DEMO_QR_PAYLOADS.length)];
    setPayload(randomPayload);
    setPhase("confirming");
  };

  const handleConfirmPayment = () => {
    if (!payload) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addTransaction({
      type: "payment",
      amount: -(payload.amount),
      description: payload.isP2P ? `Sent to ${payload.merchant}` : `Payment at ${payload.merchant}`,
      merchant: payload.merchant,
      status: "completed",
    });
    setPhase("success");
    Animated.spring(successScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  const handleClose = () => {
    router.back();
  };

  const handleScanAgain = () => {
    scanned.current = false;
    setPayload(null);
    setPhase("scanning");
    setShowManual(false);
    setManualAmount("");
    successScale.setValue(0);
  };

  const handleManualPay = () => {
    const amount = parseFloat(manualAmount);
    if (!amount || isNaN(amount)) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPayload({ merchant: "Manual Entry", amount, ref: "MANUAL-" + Date.now().toString().slice(-6) });
    setPhase("confirming");
    setShowManual(false);
  };

  if (phase === "success" && payload) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.closeRow, { top: topPad + 12 }]}>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.successContainer}>
          <Animated.View style={[styles.successCircle, { transform: [{ scale: successScale }] }]}>
            <LinearGradient colors={["#22C55E", "#16A34A"]} style={styles.successGradient}>
              <Ionicons name="checkmark" size={52} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>Payment Sent!</Text>
          <Text style={[styles.successAmount, { color: "#22C55E" }]}>
            ${payload.amount.toFixed(2)} USDC
          </Text>
          <Text style={[styles.successTo, { color: colors.mutedForeground }]}>
            to {payload.merchant}
          </Text>
          <View style={[styles.successRefBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.successRefLabel, { color: colors.mutedForeground }]}>Reference</Text>
            <Text style={[styles.successRef, { color: colors.foreground }]}>{payload.ref}</Text>
          </View>
          <Pressable
            onPress={handleScanAgain}
            style={[styles.scanAgainBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="scan-outline" size={18} color="#fff" />
            <Text style={styles.scanAgainText}>Scan Another</Text>
          </Pressable>
          <Pressable onPress={handleClose} style={styles.doneBtn}>
            <Text style={[styles.doneBtnText, { color: colors.mutedForeground }]}>Done</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (phase === "confirming" && payload) {
    const insufficient = balance < payload.amount;
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.closeRow, { top: topPad + 12 }]}>
          <Pressable onPress={handleScanAgain} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.confirmContainer}>
          <View style={[styles.merchantAvatar, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons
              name={payload.isP2P ? "person-circle-outline" : "storefront-outline"}
              size={40}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.confirmLabel, { color: colors.mutedForeground }]}>
            {payload.isP2P ? "Sending to" : "Pay to"}
          </Text>
          <Text style={[styles.confirmMerchant, { color: colors.foreground }]}>{payload.merchant}</Text>
          <Text style={[styles.confirmAmount, { color: colors.foreground }]}>
            ${payload.amount.toFixed(2)}
          </Text>
          <Text style={[styles.confirmCurrency, { color: colors.mutedForeground }]}>USDC</Text>

          <View style={[styles.confirmDetails, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmRowLabel, { color: colors.mutedForeground }]}>Ref</Text>
              <Text style={[styles.confirmRowValue, { color: colors.foreground }]}>{payload.ref}</Text>
            </View>
            <View style={[styles.confirmRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmRowLabel, { color: colors.mutedForeground }]}>Your balance</Text>
              <Text style={[styles.confirmRowValue, { color: colors.foreground }]}>${balance.toFixed(2)} USDC</Text>
            </View>
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmRowLabel, { color: colors.mutedForeground }]}>After payment</Text>
              <Text style={[styles.confirmRowValue, { color: insufficient ? colors.destructive : colors.success }]}>
                ${(balance - payload.amount).toFixed(2)} USDC
              </Text>
            </View>
          </View>

          {insufficient && (
            <View style={[styles.warningBox, { backgroundColor: "#EF444422", borderColor: colors.destructive }]}>
              <Ionicons name="warning-outline" size={16} color={colors.destructive} />
              <Text style={[styles.warningText, { color: colors.destructive }]}>Insufficient balance</Text>
            </View>
          )}

          <Pressable
            onPress={handleConfirmPayment}
            disabled={insufficient}
            style={({ pressed }) => [
              styles.confirmBtn,
              { backgroundColor: insufficient ? colors.border : colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="lock-closed" size={16} color={insufficient ? colors.mutedForeground : "#fff"} />
            <Text style={[styles.confirmBtnText, { color: insufficient ? colors.mutedForeground : "#fff" }]}>
              Confirm & Pay
            </Text>
          </Pressable>
          <Pressable onPress={handleScanAgain} style={styles.cancelBtn}>
            <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.closeRow, { top: topPad + 12 }]}>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.webFallback}>
          <View style={[styles.webIconWrap, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons name="scan-outline" size={56} color={colors.primary} />
          </View>
          <Text style={[styles.webTitle, { color: colors.foreground }]}>Scan to Pay</Text>
          <Text style={[styles.webSub, { color: colors.mutedForeground }]}>
            QR scanner works on native device.{"\n"}Enter amount manually to test:
          </Text>
          <TextInput
            style={[styles.webInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
            placeholder="Amount in USDC"
            placeholderTextColor={colors.mutedForeground}
            value={manualAmount}
            onChangeText={setManualAmount}
            keyboardType="decimal-pad"
          />
          <Pressable
            onPress={() => {
              const amount = parseFloat(manualAmount);
              if (!amount || isNaN(amount)) return;
              setPayload({ merchant: "Manual Entry", amount, ref: "MANUAL-" + Date.now().toString().slice(-6) });
              setPhase("confirming");
            }}
            style={[styles.webBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.webBtnText}>Continue</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const p = DEMO_QR_PAYLOADS[Math.floor(Math.random() * DEMO_QR_PAYLOADS.length)];
              setPayload(p);
              setPhase("confirming");
            }}
            style={[styles.webDemoBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="flash-outline" size={16} color={colors.primary} />
            <Text style={[styles.webDemoBtnText, { color: colors.primary }]}>Simulate QR Scan</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.closeRow, { top: topPad + 12 }]}>
          <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.permissionContainer}>
          <View style={[styles.permIconWrap, { backgroundColor: `${colors.primary}22` }]}>
            <Ionicons name="camera-outline" size={52} color={colors.primary} />
          </View>
          <Text style={[styles.permTitle, { color: colors.foreground }]}>Camera Access</Text>
          <Text style={[styles.permSub, { color: colors.mutedForeground }]}>
            Rewlo needs camera access to scan QR codes for payments and peer-to-peer transfers.
          </Text>
          <Pressable
            onPress={requestPermission}
            style={[styles.permBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="camera-outline" size={18} color="#fff" />
            <Text style={styles.permBtnText}>Enable Camera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Dark overlay with scan window cutout */}
      <View style={styles.overlay}>
        <View style={[styles.overlayTop, { height: topPad + 80 }]} />
        <View style={styles.overlayMiddle}>
          <View style={styles.overlaySide} />
          <View style={styles.scanWindow}>
            {/* Corner markers */}
            {[
              { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
              { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
              { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
              { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
            ].map((corner, i) => (
              <View
                key={i}
                style={[styles.corner, { borderColor: colors.primary }, corner]}
              />
            ))}
            {/* Scan line */}
            <ScanLine color={colors.primary} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>

      {/* Header */}
      <View style={[styles.scanHeader, { paddingTop: topPad + 12 }]}>
        <Pressable onPress={handleClose} style={[styles.closeBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <Text style={styles.scanTitle}>Scan to Pay</Text>
        <Pressable
          onPress={() => setShowManual(!showManual)}
          style={[styles.manualBtn, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        >
          <Ionicons name="keypad-outline" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Instruction */}
      <View style={styles.instructionWrap}>
        <View style={{ height: topPad + 80 + SCAN_SIZE + 24 }} />
        <Text style={styles.instruction}>
          Point at a Rewlo QR code to pay
        </Text>
        <Text style={styles.instructionSub}>
          In-stadium · Merchants · Peer-to-peer
        </Text>

        {showManual && (
          <View style={[styles.manualSheet, { backgroundColor: "rgba(4,17,32,0.95)", borderColor: "rgba(255,255,255,0.1)" }]}>
            <Text style={styles.manualLabel}>Enter amount manually</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="0.00 USDC"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={manualAmount}
              onChangeText={setManualAmount}
              keyboardType="decimal-pad"
              autoFocus
            />
            <Pressable
              onPress={handleManualPay}
              style={styles.manualPayBtn}
            >
              <Text style={styles.manualPayBtnText}>Continue</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom safe area */}
      <View style={{ height: bottomPad + 20 }} />
    </View>
  );
}

function ScanLine({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_SIZE - 4],
  });

  return (
    <Animated.View
      style={[
        styles.scanLine,
        { backgroundColor: color, transform: [{ translateY }] },
      ]}
    />
  );
}

const OVERLAY_COLOR = "rgba(0,0,0,0.65)";

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { backgroundColor: OVERLAY_COLOR, width: "100%" },
  overlayMiddle: { flexDirection: "row", height: SCAN_SIZE },
  overlaySide: { flex: 1, backgroundColor: OVERLAY_COLOR },
  scanWindow: { width: SCAN_SIZE, height: SCAN_SIZE, position: "relative" },
  overlayBottom: { flex: 1, backgroundColor: OVERLAY_COLOR },
  corner: { position: "absolute", width: 28, height: 28, borderRadius: 2 },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, opacity: 0.8 },

  scanHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, position: "absolute", top: 0, left: 0, right: 0 },
  scanTitle: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  closeBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  manualBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },

  instructionWrap: { position: "absolute", left: 0, right: 0, top: 0, alignItems: "center", paddingHorizontal: 40 },
  instruction: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center", marginBottom: 4 },
  instructionSub: { color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  manualSheet: { marginTop: 20, borderRadius: 18, padding: 20, borderWidth: 1, width: "100%", gap: 12 },
  manualLabel: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontFamily: "Inter_500Medium" },
  manualInput: { color: "#fff", fontSize: 28, fontFamily: "Inter_700Bold", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.2)", paddingBottom: 8 },
  manualPayBtn: { backgroundColor: "#2563EB", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  manualPayBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },

  closeRow: { position: "absolute", left: 20, zIndex: 10 },

  permissionContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 16 },
  permIconWrap: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  permTitle: { fontSize: 24, fontFamily: "Inter_700Bold" },
  permSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  permBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16, marginTop: 8 },
  permBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },

  successContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10, paddingTop: 60 },
  successCircle: { marginBottom: 8 },
  successGradient: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  successAmount: { fontSize: 42, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  successTo: { fontSize: 16, fontFamily: "Inter_400Regular" },
  successRefBox: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 14, alignItems: "center", width: "100%", marginTop: 8 },
  successRefLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  successRef: { fontSize: 15, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  scanAgainBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 16, marginTop: 12, width: "100%", justifyContent: "center" },
  scanAgainText: { color: "#fff", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  doneBtn: { paddingVertical: 12 },
  doneBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },

  confirmContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 10, paddingTop: 60 },
  merchantAvatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  confirmLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  confirmMerchant: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmAmount: { fontSize: 52, fontFamily: "Inter_700Bold", letterSpacing: -2, marginTop: 8 },
  confirmCurrency: { fontSize: 16, fontFamily: "Inter_500Medium", marginTop: -4 },
  confirmDetails: { borderRadius: 16, borderWidth: 1, overflow: "hidden", width: "100%", marginTop: 12 },
  confirmRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  confirmRowLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  confirmRowValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  warningBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, width: "100%" },
  warningText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  confirmBtn: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%", paddingVertical: 17, borderRadius: 16, justifyContent: "center", marginTop: 4 },
  confirmBtnText: { fontSize: 17, fontFamily: "Inter_700Bold" },
  cancelBtn: { paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },

  webFallback: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36, gap: 16, paddingTop: 60 },
  webIconWrap: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  webTitle: { fontSize: 26, fontFamily: "Inter_700Bold" },
  webSub: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  webInput: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 20, fontFamily: "Inter_500Medium", width: "100%", textAlign: "center" },
  webBtn: { width: "100%", paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  webBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_600SemiBold" },
  webDemoBtn: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%", paddingVertical: 14, borderRadius: 16, justifyContent: "center", borderWidth: 1 },
  webDemoBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
