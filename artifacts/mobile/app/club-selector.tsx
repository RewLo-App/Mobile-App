import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import ClubBadge from "@/components/ClubBadge";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Club, CLUBS } from "@/constants/clubs";
import { useWallet } from "@/context/WalletContext";
import { useColors } from "@/hooks/useColors";

const LEAGUES = ["All", "Premier League", "La Liga", "Ligue 1", "Serie A", "Bundesliga"];

interface ClubCardProps {
  club: Club;
  isSelected: boolean;
  onSelect: (club: Club) => void;
}

function ClubCard({ club, isSelected, onSelect }: ClubCardProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => onSelect(club)}
      style={({ pressed }) => [
        styles.clubCard,
        {
          backgroundColor: isSelected ? `${club.accentColor}15` : colors.card,
          borderColor: isSelected ? club.accentColor : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {/* Club badge */}
      <View style={styles.clubStrip}>
        <ClubBadge club={club} size={44} />
      </View>

      {/* Club info */}
      <View style={styles.clubInfo}>
        <Text style={[styles.clubName, { color: colors.foreground }]} numberOfLines={1}>
          {club.name}
        </Text>
        <Text style={[styles.clubLeague, { color: colors.mutedForeground }]}>
          {club.league}
        </Text>
      </View>

      {/* Selected check */}
      {isSelected ? (
        <View style={[styles.checkCircle, { backgroundColor: club.accentColor === "#000000" ? "#fff" : club.accentColor }]}>
          <Ionicons name="checkmark" size={14} color={club.accentColor === "#FDE100" || club.accentColor === "#FFFFFF" ? "#000" : "#fff"} />
        </View>
      ) : (
        <View style={[styles.emptyCircle, { borderColor: colors.border }]} />
      )}
    </Pressable>
  );
}

export default function ClubSelectorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { selectedClubId, setSelectedClub, user } = useWallet();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState(selectedClubId);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = CLUBS.filter((c) => {
    const matchLeague = filter === "All" || c.league === filter;
    const matchSearch =
      search.length === 0 ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shortName.toLowerCase().includes(search.toLowerCase());
    return matchLeague && matchSearch;
  });

  const handleSelect = (club: Club) => {
    Haptics.selectionAsync();
    setLocalSelected(club.id);
  };

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelectedClub(localSelected);
    router.back();
  };

  const selectedClub = CLUBS.find((c) => c.id === localSelected) ?? CLUBS[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
        >
          <Ionicons name="close" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Choose Your Club</Text>
        <Pressable
          onPress={handleConfirm}
          style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.confirmBtnText}>Done</Text>
        </Pressable>
      </View>

      {/* Selected Preview */}
      <LinearGradient
        colors={[selectedClub.gradientStart, selectedClub.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.selectedPreview}
      >
        <ClubBadge club={selectedClub} size={52} />
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedLabel}>Currently Supporting</Text>
          <Text style={styles.selectedName}>{selectedClub.name}</Text>
          <Text style={styles.selectedLeague}>{selectedClub.league}</Text>
        </View>
      </LinearGradient>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search clubs..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* League Filter */}
      <FlatList
        data={LEAGUES}
        keyExtractor={(l) => l}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 8 }}
        style={{ flexGrow: 0 }}
        renderItem={({ item: league }) => (
          <Pressable
            onPress={() => { setFilter(league); Haptics.selectionAsync(); }}
            style={[
              styles.leagueChip,
              {
                backgroundColor: filter === league ? colors.primary : colors.card,
                borderColor: filter === league ? colors.primary : colors.border,
              },
            ]}
          >
            <Text style={[styles.leagueChipText, { color: filter === league ? "#fff" : colors.mutedForeground }]}>
              {league}
            </Text>
          </Pressable>
        )}
      />

      {/* Club List */}
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: bottomPad + 20 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <ClubCard
            club={item}
            isSelected={localSelected === item.id}
            onSelect={handleSelect}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="football-outline" size={40} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No clubs found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  confirmBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  selectedPreview: {
    marginHorizontal: 20,
    borderRadius: 18,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  selectedInfo: { flex: 1 },
  selectedLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 3,
  },
  selectedName: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  selectedLeague: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  selectedBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedAbbrv: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  leagueChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  leagueChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    gap: 14,
  },
  clubStrip: {
    width: 60,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  clubAbbrv: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  clubInfo: { flex: 1, paddingVertical: 14 },
  clubName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  clubLeague: { fontSize: 12, fontFamily: "Inter_400Regular" },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  emptyCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    marginRight: 16,
  },
  empty: { alignItems: "center", paddingTop: 40, gap: 10 },
  emptyText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
