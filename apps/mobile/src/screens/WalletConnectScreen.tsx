import "../polyfills";

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { asciiBuffer, explorerUrl, MEMO_PROGRAM_ID } from "../wallet";

type StepTone = "safe" | "warning" | "danger" | "info";

const receiptPreview = [
  ["Agent", "Research Agent"],
  ["Network", "Solana devnet"],
  ["Policy", "Within read-only wallet-risk policy"],
  ["Manifest", "2f4a...d91c"],
];

export function WalletConnectScreen() {
  const [signature, setSignature] = useState<string | null>(null);
  const [status, setStatus] = useState("Wallet not connected");
  const [isBusy, setIsBusy] = useState(false);
  const { account, connect, disconnect, signAndSendTransaction, connection } =
    useMobileWallet();

  const address = account?.publicKey.toBase58();
  const shortAddress = useMemo(() => {
    if (!address) return "No wallet";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);

  async function handleConnect() {
    setIsBusy(true);
    setStatus("Opening wallet approval");
    try {
      const connected = await connect();
      setStatus(`Connected ${connected.publicKey.toBase58().slice(0, 8)}...`);
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDisconnect() {
    setIsBusy(true);
    try {
      await disconnect();
      setSignature(null);
      setStatus("Wallet disconnected");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignProbe() {
    setIsBusy(true);
    setStatus("Preparing devnet receipt probe");

    try {
      const activeAccount = account ?? (await connect());
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const minContextSlot = await connection.getSlot("confirmed");
      const transaction = new Transaction({
        feePayer: activeAccount.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        new TransactionInstruction({
          keys: [],
          programId: new PublicKey(MEMO_PROGRAM_ID),
          data: asciiBuffer("SkillGuard devnet receipt probe"),
        })
      );

      const txSignature = await signAndSendTransaction(transaction, minContextSlot);
      setSignature(txSignature);
      setStatus("Devnet signature received");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/icon.png")}
            style={styles.icon}
            resizeMode="contain"
          />
          <View style={styles.headerCopy}>
            <Text style={styles.appName}>SkillGuard</Text>
            <Text style={styles.tagline}>The permission layer for Solana agents</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Badge tone="info" label="devnet" />
            <Badge
              tone={account ? "safe" : "warning"}
              label={account ? "connected" : "approval"}
            />
          </View>
          <Text style={styles.heroTitle}>Research Agent wants to use your wallet.</Text>
          <Text style={styles.heroBody}>
            Review the requested action, connect your wallet, and produce a devnet proof
            signature for the approval flow.
          </Text>

          <View style={styles.walletPanel}>
            <Text style={styles.panelLabel}>Wallet</Text>
            <Text style={styles.walletAddress}>{shortAddress}</Text>
            <Text style={styles.statusText}>{status}</Text>
          </View>

          <View style={styles.actionRow}>
            <PrimaryButton
              label={account ? "Reconnect" : "Connect wallet"}
              onPress={handleConnect}
              disabled={isBusy}
            />
            <SecondaryButton
              label="Disconnect"
              onPress={handleDisconnect}
              disabled={isBusy || !account}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Approval preview</Text>
          <View style={styles.requestCard}>
            {receiptPreview.map(([label, value]) => (
              <View key={label} style={styles.metaRow}>
                <Text style={styles.metaLabel}>{label}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receipt probe</Text>
          <View style={styles.timeline}>
            <TimelineStep tone="safe" title="Policy evaluated" body="Read-only risk request fits policy." />
            <TimelineStep tone="warning" title="Wallet approval" body="User approval is required on mobile." />
            <TimelineStep
              tone={signature ? "safe" : "info"}
              title="Devnet signature"
              body={signature ? `${signature.slice(0, 16)}...${signature.slice(-12)}` : "Not signed yet"}
            />
          </View>

          <PrimaryButton
            label={isBusy ? "Working..." : "Sign devnet probe"}
            onPress={handleSignProbe}
            disabled={isBusy}
          />
          {signature ? (
            <View style={styles.secondaryAction}>
              <SecondaryButton
                label="Open in Explorer"
                onPress={() => Linking.openURL(explorerUrl(signature))}
              />
            </View>
          ) : null}
          {isBusy ? <ActivityIndicator color="#00F0A8" style={styles.spinner} /> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ label, tone }: { label: string; tone: StepTone }) {
  return (
    <View style={[styles.badge, toneStyles[tone].badge]}>
      <Text style={[styles.badgeText, toneStyles[tone].text]}>{label}</Text>
    </View>
  );
}

function TimelineStep({
  body,
  title,
  tone,
}: {
  body: string;
  title: string;
  tone: StepTone;
}) {
  return (
    <View style={styles.timelineStep}>
      <View style={[styles.timelineDot, toneStyles[tone].dot]} />
      <View style={styles.timelineCopy}>
        <Text style={styles.timelineTitle}>{title}</Text>
        <Text style={styles.timelineBody}>{body}</Text>
      </View>
    </View>
  );
}

function PrimaryButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({
  disabled,
  label,
  onPress,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryButton,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
    >
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

function readError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Wallet action failed";
}

const toneStyles = {
  safe: {
    badge: { borderColor: "rgba(0,240,168,0.36)", backgroundColor: "rgba(0,240,168,0.1)" },
    dot: { backgroundColor: "#00F0A8" },
    text: { color: "#00F0A8" },
  },
  warning: {
    badge: { borderColor: "rgba(245,184,75,0.38)", backgroundColor: "rgba(245,184,75,0.12)" },
    dot: { backgroundColor: "#F5B84B" },
    text: { color: "#F5B84B" },
  },
  danger: {
    badge: { borderColor: "rgba(255,90,104,0.4)", backgroundColor: "rgba(255,90,104,0.12)" },
    dot: { backgroundColor: "#FF5A68" },
    text: { color: "#FF5A68" },
  },
  info: {
    badge: { borderColor: "rgba(88,166,255,0.36)", backgroundColor: "rgba(88,166,255,0.1)" },
    dot: { backgroundColor: "#58A6FF" },
    text: { color: "#58A6FF" },
  },
} as const;

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  appName: { color: "#F8FAFC", fontSize: 24, fontWeight: "800", letterSpacing: 0 },
  badge: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  content: { gap: 18, padding: 18, paddingBottom: 36 },
  disabledButton: { opacity: 0.45 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginTop: 8 },
  headerCopy: { flex: 1 },
  heroBody: { color: "#A7B0C0", fontSize: 15, lineHeight: 22, marginTop: 10 },
  heroCard: {
    backgroundColor: "#0B1220",
    borderColor: "rgba(148,163,184,0.16)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 32,
    marginTop: 18,
  },
  heroTopRow: { flexDirection: "row", gap: 8 },
  icon: { height: 48, width: 48 },
  metaLabel: { color: "#6B7280", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  metaRow: {
    borderBottomColor: "rgba(148,163,184,0.1)",
    borderBottomWidth: 1,
    gap: 4,
    paddingVertical: 10,
  },
  metaValue: { color: "#F8FAFC", fontSize: 15, fontWeight: "600" },
  panelLabel: { color: "#6B7280", fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  pressedButton: { transform: [{ scale: 0.99 }] },
  primaryButton: {
    alignItems: "center",
    backgroundColor: "#00F0A8",
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButtonText: { color: "#03130D", fontSize: 15, fontWeight: "800" },
  requestCard: {
    backgroundColor: "#070D18",
    borderColor: "rgba(148,163,184,0.16)",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  safeArea: { backgroundColor: "#030712", flex: 1 },
  secondaryButton: {
    alignItems: "center",
    borderColor: "rgba(248,250,252,0.18)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: "#F8FAFC", fontSize: 15, fontWeight: "700" },
  secondaryAction: { marginTop: 10 },
  section: {
    backgroundColor: "#0B1220",
    borderColor: "rgba(148,163,184,0.16)",
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
    padding: 18,
  },
  sectionTitle: { color: "#F8FAFC", fontSize: 18, fontWeight: "800" },
  spinner: { marginTop: 12 },
  statusText: { color: "#A7B0C0", fontSize: 13, marginTop: 6 },
  tagline: { color: "#A7B0C0", fontSize: 13, lineHeight: 18 },
  timeline: { gap: 14 },
  timelineBody: { color: "#A7B0C0", fontSize: 13, lineHeight: 19 },
  timelineCopy: { flex: 1, gap: 3 },
  timelineDot: { borderRadius: 999, height: 10, marginTop: 4, width: 10 },
  timelineStep: { flexDirection: "row", gap: 10 },
  timelineTitle: { color: "#F8FAFC", fontSize: 14, fontWeight: "700" },
  walletAddress: { color: "#F8FAFC", fontSize: 20, fontWeight: "800", marginTop: 5 },
  walletPanel: {
    backgroundColor: "#070D18",
    borderColor: "rgba(148,163,184,0.16)",
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
});
