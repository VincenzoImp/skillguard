import { StyleSheet, Text, View } from "react-native";
import type { PolicyCheck } from "../liveState";
import { colors, toneColors } from "../theme";

interface PolicyCheckListProps {
  checks: PolicyCheck[];
}

export function PolicyCheckList({ checks }: PolicyCheckListProps) {
  return (
    <View style={styles.list}>
      {checks.map((check) => {
        const palette = toneColors[check.tone];

        return (
          <View key={check.label} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: palette.fg }]} />
            <View style={styles.copy}>
              <Text style={styles.label}>{check.label}</Text>
              <Text style={styles.detail}>{check.detail}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { flex: 1, gap: 3 },
  detail: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  dot: { borderRadius: 999, height: 10, marginTop: 4, width: 10 },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  list: { gap: 14 },
  row: { flexDirection: "row", gap: 10 },
});
