import { Pressable, StyleSheet, Text, View } from "react-native";
import type { MobileAction } from "../liveState";
import { PolicyCheckList } from "../components/PolicyCheckList";
import { StatusBadge } from "../components/StatusBadge";
import { colors, labelForStatus, toneForStatus } from "../theme";

interface ActionDetailScreenProps {
  action: MobileAction;
  isBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export function ActionDetailScreen({
  action,
  isBusy,
  onApprove,
  onReject,
}: ActionDetailScreenProps) {
  const canDecide = action.status === "pending" && !isBusy;
  const approvalImpact = describeApprovalImpact(action);

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={styles.copy}>
          <Text style={styles.kicker}>Action detail</Text>
          <Text style={styles.title}>{action.title}</Text>
        </View>
        <StatusBadge
          label={labelForStatus(action.status)}
          tone={toneForStatus(action.status)}
        />
      </View>
      <Text style={styles.body}>{action.summary}</Text>
      <View style={styles.metaGrid}>
        <Info label="Spend" value={action.spend} />
        <Info label="Network" value={action.network} />
        <Info label="Manifest" value={`${action.manifestHash.slice(0, 12)}...`} />
      </View>
      <View style={styles.outcomeBox}>
        <Text style={styles.outcomeLabel}>After approval</Text>
        <Text style={styles.outcomeText}>{approvalImpact}</Text>
      </View>
      <PolicyCheckList checks={action.checks} />
      {action.decisionReason ? (
        <Text style={styles.reason}>{action.decisionReason}</Text>
      ) : null}
      <View style={styles.actionRow}>
        <DecisionButton
          label={isBusy ? "Opening wallet..." : "Approve in wallet"}
          onPress={onApprove}
          disabled={!canDecide}
          variant="primary"
        />
        <DecisionButton
          label="Reject"
          onPress={onReject}
          disabled={!canDecide}
          variant="secondary"
        />
      </View>
    </View>
  );
}

function describeApprovalImpact(action: MobileAction): string {
  if (totalSpendAtomic(action) > 0n || action.manifest.rawTransactionRef !== null) {
    return "Your wallet signs a transaction only after you approve. The result appears in Activity with the receipt hash and Explorer link when available.";
  }
  return "No funds move. If this agent is set to Allow under limits, future low-risk zero-spend requests can be auto-approved and recorded as receipt-only outcomes.";
}

function totalSpendAtomic(action: MobileAction): bigint {
  return action.manifest.spend.reduce(
    (total, spend) => total + BigInt(spend.amountAtomic),
    0n
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function DecisionButton({
  disabled,
  label,
  onPress,
  variant,
}: {
  disabled: boolean;
  label: string;
  onPress: () => void;
  variant: "primary" | "secondary";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.decisionButton,
        variant === "primary" ? styles.primaryButton : styles.secondaryButton,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <Text
        style={[
          styles.decisionText,
          variant === "primary" ? styles.primaryText : styles.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 10 },
  body: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  copy: { flex: 1, gap: 5 },
  decisionButton: {
    alignItems: "center",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 12,
  },
  decisionText: { fontSize: 14, fontWeight: "800", textAlign: "center" },
  disabledButton: { opacity: 0.45 },
  info: { flex: 1, gap: 4 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: "800" },
  kicker: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  metaGrid: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingVertical: 14,
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  outcomeBox: {
    backgroundColor: "rgba(88,166,255,0.08)",
    borderColor: "rgba(88,166,255,0.22)",
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
    padding: 12,
  },
  outcomeLabel: { color: colors.info, fontSize: 12, fontWeight: "800" },
  outcomeText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  pressed: { transform: [{ scale: 0.99 }] },
  primaryButton: { backgroundColor: colors.mint },
  primaryText: { color: colors.mintText },
  reason: { color: colors.textSecondary, fontSize: 13, fontWeight: "700" },
  secondaryButton: { borderColor: colors.borderStrong, borderWidth: 1 },
  secondaryText: { color: colors.text },
  title: { color: colors.text, fontSize: 19, fontWeight: "800", lineHeight: 24 },
  topRow: { alignItems: "flex-start", flexDirection: "row", gap: 12 },
});
