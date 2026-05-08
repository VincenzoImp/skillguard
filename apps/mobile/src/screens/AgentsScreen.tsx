import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ConnectedAgent } from "../demoState";
import { colors } from "../theme";
import { StatusBadge } from "../components/StatusBadge";

interface AgentsScreenProps {
  agent: ConnectedAgent;
  onRevoke: () => void;
}

export function AgentsScreen({ agent, onRevoke }: AgentsScreenProps) {
  const isRevoked = agent.status === "revoked";

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Connected agent</Text>
          <Text style={styles.title}>{agent.name}</Text>
          <Text style={styles.body}>{agent.description}</Text>
        </View>
        <StatusBadge
          label={isRevoked ? "Revoked" : "Active"}
          tone={isRevoked ? "danger" : "safe"}
        />
      </View>
      <View style={styles.metaGrid}>
        <InfoCell label="Last seen" value={agent.lastSeen} />
        <InfoCell label="Network" value={agent.policy.network} />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={isRevoked}
        onPress={onRevoke}
        style={({ pressed }) => [
          styles.revokeButton,
          isRevoked ? styles.disabledButton : null,
          pressed && !isRevoked ? styles.pressed : null,
        ]}
      >
        <Text style={styles.revokeText}>
          {isRevoked ? "Agent revoked" : "Revoke agent"}
        </Text>
      </Pressable>
    </View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  copy: { flex: 1, gap: 5 },
  disabledButton: { opacity: 0.45 },
  infoCell: { flex: 1, gap: 4 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: "700" },
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaGrid: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingTop: 14,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  pressed: { transform: [{ scale: 0.99 }] },
  revokeButton: {
    alignItems: "center",
    borderColor: "rgba(255,90,104,0.4)",
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
  },
  revokeText: { color: colors.danger, fontSize: 15, fontWeight: "800" },
  title: { color: colors.text, fontSize: 19, fontWeight: "800" },
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
});
