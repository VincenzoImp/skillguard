import { StyleSheet, Text, View } from "react-native";
import type { RiskTone } from "../liveState";
import { toneColors } from "../theme";

interface StatusBadgeProps {
  label: string;
  tone: RiskTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const palette = toneColors[tone];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <Text style={[styles.badgeText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});
