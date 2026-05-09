import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ConnectedAgent, PolicyMode } from "../liveState";
import {
  buildPermissionCards,
  type PermissionCard,
} from "../permissionPresentation";
import { colors, labelForPolicyMode } from "../theme";
import { StatusBadge } from "../components/StatusBadge";

interface AgentsScreenProps {
  agents: ConnectedAgent[];
  onModeChange: (connectionId: string, mode: PolicyMode) => void;
  onRevoke: (connectionId: string) => void;
}

const modes: PolicyMode[] = ["ask_every_time", "allow_under_limits", "block"];

export function AgentsScreen({
  agents,
  onModeChange,
  onRevoke,
}: AgentsScreenProps) {
  const activeAgents = agents.filter((agent) => agent.status === "active");
  const permissionCards = new Map(
    buildPermissionCards(activeAgents).map((card) => [card.connectionId, card])
  );

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>Connected agents</Text>
      <Text style={styles.panelIntro}>
        Each card controls one agent only. Revoked agents are hidden from this
        list and cannot submit new wallet requests.
      </Text>
      {activeAgents.length === 0 ? (
        <Text style={styles.body}>No active agent connections for this wallet.</Text>
      ) : null}
      {activeAgents.map((agent) => (
        <AgentRow
          agent={agent}
          key={agent.connectionId}
          onModeChange={onModeChange}
          onRevoke={onRevoke}
          permissions={permissionCards.get(agent.connectionId)}
        />
      ))}
    </View>
  );
}

function AgentRow({
  agent,
  onModeChange,
  onRevoke,
  permissions,
}: {
  agent: ConnectedAgent;
  onModeChange: (connectionId: string, mode: PolicyMode) => void;
  onRevoke: (connectionId: string) => void;
  permissions: PermissionCard | undefined;
}) {
  return (
    <View style={styles.agentCard}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.title}>{agent.name}</Text>
          <Text style={styles.body}>{agent.description}</Text>
        </View>
        <StatusBadge label="Active" tone="safe" />
      </View>
      <View style={styles.metaGrid}>
        <InfoCell label="Agent ID" value={agent.id} />
        <InfoCell label="Network" value={agent.policy.network} />
        <InfoCell label="Last seen" value={agent.lastSeen} />
      </View>
      {permissions ? (
        <View style={styles.policyBlock}>
          <View>
            <Text style={styles.policyTitle}>Policy for this agent</Text>
            <Text style={styles.policyHelp}>
              Allow under limits auto-approves only low-risk zero-spend
              requests. Any spend, higher risk, or raw transaction still needs
              wallet approval.
            </Text>
          </View>
          <View style={styles.segmented}>
            {modes.map((mode) => {
              const isActive = permissions.mode === mode;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={mode}
                  onPress={() => onModeChange(agent.connectionId, mode)}
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
            {permissions.rules.map((rule) => (
              <InfoCell key={rule.label} label={rule.label} value={rule.value} />
            ))}
          </View>
        </View>
      ) : null}
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
  infoCell: { flexGrow: 1, flexShrink: 1, gap: 4, minWidth: "42%" },
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
    flexWrap: "wrap",
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
  panelIntro: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  policyBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 12,
    paddingTop: 14,
  },
  policyHelp: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  policyTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
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
  ruleList: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 12,
  },
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
  title: { color: colors.text, fontSize: 19, fontWeight: "800" },
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
});
