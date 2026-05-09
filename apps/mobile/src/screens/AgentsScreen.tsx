import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ConnectedAgent } from "../liveState";
import { colors } from "../theme";
import { StatusBadge } from "../components/StatusBadge";

interface AgentsScreenProps {
  agents: ConnectedAgent[];
  onRevoke: (connectionId: string) => void;
}

export function AgentsScreen({ agents, onRevoke }: AgentsScreenProps) {
  const activeAgents = agents.filter((agent) => agent.status === "active");

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>Connected agents</Text>
      {activeAgents.length === 0 ? (
        <Text style={styles.body}>No active agent connections for this wallet.</Text>
      ) : null}
      {activeAgents.map((agent) => (
        <AgentRow agent={agent} key={agent.connectionId} onRevoke={onRevoke} />
      ))}
    </View>
  );
}

function AgentRow({
  agent,
  onRevoke,
}: {
  agent: ConnectedAgent;
  onRevoke: (connectionId: string) => void;
}) {
  return (
    <View style={styles.agentCard}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>{agent.name}</Text>
          <Text style={styles.body}>{agent.description}</Text>
        </View>
        <StatusBadge
          label="Active"
          tone="safe"
        />
      </View>
      <View style={styles.metaGrid}>
        <InfoCell label="Agent ID" value={agent.id} />
        <InfoCell label="Network" value={agent.policy.network} />
      </View>
      <View style={styles.metaGrid}>
        <InfoCell label="Last seen" value={agent.lastSeen} />
        <InfoCell label="Mode" value={agent.policy.mode.replaceAll("_", " ")} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => onRevoke(agent.connectionId)}
        style={({ pressed }) => [
          styles.revokeButton,
          pressed ? styles.pressed : null,
        ]}
      >
        <Text style={styles.revokeText}>Revoke agent</Text>
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
  agentCard: {
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 14,
    padding: 14,
  },
  body: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  copy: { flex: 1, gap: 5 },
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
