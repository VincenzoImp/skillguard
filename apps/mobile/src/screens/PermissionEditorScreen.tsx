import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ConnectedAgent, PolicyMode } from "../liveState";
import { buildPermissionCards } from "../permissionPresentation";
import { colors, labelForPolicyMode } from "../theme";

interface PermissionEditorScreenProps {
  agents: ConnectedAgent[];
  onModeChange: (connectionId: string, mode: PolicyMode) => void;
}

const modes: PolicyMode[] = ["ask_every_time", "allow_under_limits", "block"];

export function PermissionEditorScreen({
  agents,
  onModeChange,
}: PermissionEditorScreenProps) {
  const cards = buildPermissionCards(agents);

  if (cards.length === 0) {
    return (
      <View style={styles.panel}>
        <View>
          <Text style={styles.kicker}>Permissions</Text>
          <Text style={styles.title}>No active policies</Text>
        </View>
        <Text style={styles.subtitle}>
          Import an agent to create wallet-scoped permissions.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {cards.map((card) => (
        <View key={card.connectionId} style={styles.panel}>
          <View>
            <Text style={styles.kicker}>Permissions</Text>
            <Text style={styles.title}>{card.agentName}</Text>
            <Text style={styles.subtitle}>{card.description}</Text>
          </View>
          <View style={styles.segmented}>
            {modes.map((mode) => {
              const isActive = card.mode === mode;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={mode}
                  onPress={() => onModeChange(card.connectionId, mode)}
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
            {card.rules.map((rule) => (
              <Rule key={rule.label} label={rule.label} value={rule.value} />
            ))}
          </View>
        </View>
      ))}
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
  stack: { gap: 14 },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
  },
  title: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: 5 },
});
