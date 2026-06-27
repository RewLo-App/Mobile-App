import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VirtualCard, useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

const SCREEN_W = Dimensions.get("window").width;
const CARD_W = SCREEN_W - 48;

interface CardItemProps {
  item: VirtualCard;
  isActive: boolean;
}

function CardItem({ item, isActive }: CardItemProps) {
  const infoRows = [
    { label: "Card Number", value: `•••• •••• •••• ${item.last4}` },
    { label: "Expiry", value: `${String(item.expiryMonth).padStart(2, "0")}/${item.expiryYear}` },
    { label: "Network", value: item.brand.toUpperCase() },
    { label: "Status", value: item.isDefault ? "Default" : "Active" },
  ];

  return (
    <View style={[styles.cardSlide, { width: CARD_W }]}>
      <LinearGradient
        colors={[item.gradientStart, item.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.virtualCard}
      >
        {/* Club name */}
        <Text style={styles.cardClub}>{item.clubName}</Text>

        {/* Chip */}
        <View style={styles.cardChip}>
          <View style={styles.chipInner} />
        </View>

        {/* Card number */}
        <Text style={styles.cardNumber}>•••• •••• •••• {item.last4}</Text>

        {/* Bottom row */}
        <View style={styles.cardBottom}>
          <View>
            <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
            <Text style={styles.cardFieldValue}>{item.cardholderName}</Text>
          </View>
          <View>
            <Text style={styles.cardFieldLabel}>EXPIRES</Text>
            <Text style={styles.cardFieldValue}>
              {String(item.expiryMonth).padStart(2, "0")}/{item.expiryYear}
            </Text>
          </View>
          <Text style={styles.cardBrand}>
            {item.brand === "visa" ? "VISA" : "MC"}
          </Text>
        </View>

        {/* Decorative circles */}
        <View style={[styles.decCircle, { top: -40, right: -40, opacity: 0.1 }]} />
        <View style={[styles.decCircle, { bottom: -60, left: -20, opacity: 0.07, width: 180, height: 180, borderRadius: 90 }]} />
      </LinearGradient>

      {/* Card Info */}
      {isActive && (
        <View style={{ gap: 0 }}>
          {infoRows.map((r) => (
            <CardInfoRow key={r.label} label={r.label} value={r.value} />
          ))}
        </View>
      )}
    </View>
  );
}

function CardInfoRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function CardsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cards } = useWallet();
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>My Cards</Text>
        <Pressable
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={cards}
        keyExtractor={(c) => c.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24 }}
        snapToInterval={CARD_W + 16}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 16));
          setActiveIndex(idx);
          Haptics.selectionAsync();
        }}
        renderItem={({ item, index }) => (
          <CardItem item={item} isActive={index === activeIndex} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        style={{ flexGrow: 0 }}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {cards.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? colors.primary : colors.border,
                width: i === activeIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Card Details */}
      <View style={[styles.detailsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.detailsHeader}>
          <Text style={[styles.detailsTitle, { color: colors.foreground }]}>Card Details</Text>
          {cards[activeIndex]?.isDefault && (
            <View style={[styles.defaultBadge, { backgroundColor: `${colors.success}22` }]}>
              <Text style={[styles.defaultText, { color: colors.success }]}>Default</Text>
            </View>
          )}
        </View>

        <View style={[styles.cardActions, { borderTopColor: colors.border }]}>
          {[
            { label: "Freeze", icon: "snow-outline" as keyof typeof Ionicons.glyphMap },
            { label: "Details", icon: "eye-outline" as keyof typeof Ionicons.glyphMap },
            { label: "Limits", icon: "options-outline" as keyof typeof Ionicons.glyphMap },
            { label: "Replace", icon: "refresh-outline" as keyof typeof Ionicons.glyphMap },
          ].map((a) => (
            <Pressable
              key={a.label}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              style={({ pressed }) => [styles.cardAction, { opacity: pressed ? 0.7 : 1 }]}
            >
              <View style={[styles.cardActionIcon, { backgroundColor: `${colors.primary}22` }]}>
                <Ionicons name={a.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardActionLabel, { color: colors.mutedForeground }]}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, paddingBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "800" as const, fontFamily: "Inter_700Bold" },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  cardSlide: { paddingBottom: 8 },
  virtualCard: {
    borderRadius: 22,
    padding: 24,
    height: 200,
    overflow: "hidden",
    position: "relative",
    marginBottom: 0,
  },
  cardClub: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase" },
  cardChip: { width: 36, height: 28, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 6, marginTop: 14, overflow: "hidden" },
  chipInner: { width: 36, height: 14, backgroundColor: "rgba(255,255,255,0.15)", marginTop: 7 },
  cardNumber: { color: "#FFFFFF", fontSize: 18, fontFamily: "Inter_500Medium", letterSpacing: 2, marginTop: 18 },
  cardBottom: { flexDirection: "row", alignItems: "flex-end", marginTop: 14, gap: 20, flex: 1 },
  cardFieldLabel: { color: "rgba(255,255,255,0.6)", fontSize: 10, fontFamily: "Inter_400Regular", letterSpacing: 1, marginBottom: 2 },
  cardFieldValue: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  cardBrand: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold", marginLeft: "auto" as any, fontStyle: "italic" },
  decCircle: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "#fff" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 16, alignItems: "center" },
  dot: { height: 8, borderRadius: 4 },
  detailsSection: { marginHorizontal: 24, borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  detailsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18 },
  detailsTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  defaultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  defaultText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  infoLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  cardActions: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 16, borderTopWidth: 1 },
  cardAction: { alignItems: "center", gap: 8 },
  cardActionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardActionLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
