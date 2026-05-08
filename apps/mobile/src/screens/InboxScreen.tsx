import { StyleSheet, Text, View } from "react-native";
import type { DemoAction } from "../demoState";
import { ActionCard } from "../components/ActionCard";
import { colors } from "../theme";

interface InboxScreenProps {
  actions: DemoAction[];
  selectedActionId: string;
  onSelectAction: (actionId: string) => void;
}

export function InboxScreen({
  actions,
  onSelectAction,
  selectedActionId,
}: InboxScreenProps) {
  return (
    <View style={styles.section}>
      <View>
        <Text style={styles.kicker}>Inbox</Text>
        <Text style={styles.title}>Agent requests</Text>
      </View>
      <View style={styles.list}>
        {actions.map((action) => (
          <ActionCard
            action={action}
            isSelected={selectedActionId === action.id}
            key={action.id}
            onPress={() => onSelectAction(action.id)}
          />
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
  list: { gap: 10 },
  section: { gap: 12 },
  title: { color: colors.text, fontSize: 19, fontWeight: "800", marginTop: 5 },
});
