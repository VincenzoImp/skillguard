import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AgentPolicy, PolicyMode } from "../demoState";
import { colors, labelForPolicyMode } from "../theme";

interface PermissionEditorScreenProps {
  policy: AgentPolicy;
  onModeChange: (mode: PolicyMode) => void;
}

const modes: PolicyMode[] = ["ask_every_time", "allow_under_limits", "block"];

export function PermissionEditorScreen({
  onModeChange,
  policy,
}: PermissionEditorScreenProps) {
  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.kicker}>Permissions</Text>
        <Text style={styles.title}>Wallet policy</Text>
      </View>
      <View style={styles.segmented}>
        {modes.map((mode) => {
          const isActive = policy.mode === mode;
          return (
            <Pressable
              accessibilityRole="button"
              key={mode}
              onPress={() => onModeChange(mode)}
              style={[styles.segment, isActive ? styles.segmentActive : null]}
            >
              <Text
                style={[
                  styles.segmentText,
                  isActive ? styles.segmentTextActive : null,
                ]}
              >
                {labelForPolicyMode(mode)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.ruleList}>
        <Rule label="Spend limit" value={policy.spendLimit} />
        <Rule label="Network" value={policy.network} />
        <Rule label="Protocols" value={policy.allowedProtocols.join(", ")} />
        <Rule label="Allowed actions" value={policy.permissions.join(", ")} />
      </View>
    </View>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.rule}>
      <Text style={styles.ruleLabel}>{label}</Text>
      <Text style={styles.ruleValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  rule: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 4,
    paddingTop: 12,
  },
  ruleLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  ruleList: { gap: 12 },
  ruleValue: { color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  segment: {
    alignItems: "center",
    borderRadius: 7,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 8,
  },
  segmentActive: { backgroundColor: colors.mint },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  segmentTextActive: { color: colors.mintText },
  segmented: {
    backgroundColor: colors.deep,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 4,
  },
  title: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: 5 },
});
