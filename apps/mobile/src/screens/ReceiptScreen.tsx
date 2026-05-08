import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import type { DemoAction } from "../demoState";
import { colors, labelForStatus, toneForStatus } from "../theme";
import { StatusBadge } from "../components/StatusBadge";
import { explorerUrl } from "../wallet";

interface ReceiptScreenProps {
  actions: DemoAction[];
}

export function ReceiptScreen({ actions }: ReceiptScreenProps) {
  const receiptActions = actions.filter((action) => action.status !== "pending");

  return (
    <View style={styles.panel}>
      <View>
        <Text style={styles.kicker}>Receipts</Text>
        <Text style={styles.title}>Decision history</Text>
      </View>
      <View style={styles.timeline}>
        {receiptActions.map((action) => (
          <View key={action.id} style={styles.receiptRow}>
            <View style={styles.receiptTop}>
              <Text style={styles.receiptTitle}>{action.title}</Text>
              <StatusBadge
                label={labelForStatus(action.status)}
                tone={toneForStatus(action.status)}
              />
            </View>
            <Text style={styles.receiptMeta}>{action.manifestHash}</Text>
            {action.signature ? (
              <Pressable
                accessibilityRole="link"
                onPress={() => Linking.openURL(explorerUrl(action.signature ?? ""))}
              >
                <Text style={styles.linkText}>
                  {action.signature.slice(0, 16)}...open in Explorer
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.receiptMeta}>
                {action.decisionReason ?? "No signature required."}
              </Text>
            )}
          </View>
        ))}
      </View>
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
  linkText: { color: colors.mint, fontFamily: "monospace", fontSize: 12 },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
    padding: 18,
  },
  receiptMeta: { color: colors.textMuted, fontFamily: "monospace", fontSize: 12 },
  receiptRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 8,
    paddingTop: 12,
  },
  receiptTitle: { color: colors.text, flex: 1, fontSize: 14, fontWeight: "800" },
  receiptTop: { alignItems: "flex-start", flexDirection: "row", gap: 10 },
  timeline: { gap: 12 },
  title: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: 5 },
});
