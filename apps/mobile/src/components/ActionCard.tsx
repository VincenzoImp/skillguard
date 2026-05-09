import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MobileAction } from "../liveState";
import { colors, labelForStatus, toneForStatus } from "../theme";
import { StatusBadge } from "./StatusBadge";

interface ActionCardProps {
  action: MobileAction;
  isSelected: boolean;
  onPress: () => void;
}

export function ActionCard({ action, isSelected, onPress }: ActionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected ? styles.selected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.topRow}>
        <Text style={styles.title}>{action.title}</Text>
        <StatusBadge
          label={labelForStatus(action.status)}
          tone={toneForStatus(action.status)}
        />
      </View>
      <Text style={styles.summary}>{action.summary}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{action.spend}</Text>
        <Text style={styles.meta}>{action.requestedAt}</Text>
        <Text style={styles.hash}>{action.manifestHash.slice(0, 10)}...</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  hash: { color: colors.textMuted, fontFamily: "Courier", fontSize: 12 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  pressed: { transform: [{ scale: 0.99 }] },
  selected: { borderColor: "rgba(0,240,168,0.48)" },
  summary: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  title: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
});
