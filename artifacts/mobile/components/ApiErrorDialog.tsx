import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

export function ApiErrorDialog({
  message,
  onClose,
  title = "Something went wrong",
}: {
  message: string | null;
  onClose: () => void;
  title?: string;
}) {
  const colors = useColors();
  return (
    <Modal transparent visible={Boolean(message)} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.dialog, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="alert-circle" size={30} color="#EF4444" />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
          <Pressable onPress={onClose} style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}>
            <Text style={styles.buttonText}>OK</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0, 10, 25, 0.72)", alignItems: "center", justifyContent: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 360, borderRadius: 22, borderWidth: 1, padding: 24, alignItems: "center" },
  iconWrap: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(239, 68, 68, 0.14)", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  message: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center", marginTop: 10 },
  button: { alignSelf: "stretch", height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
