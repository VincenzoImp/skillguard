import "../polyfills";

import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Transaction } from "@solana/web3.js";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { StatusBadge } from "../components/StatusBadge";
import { createSkillGuardApiClient } from "../liveApi";
import {
  emptyMobileState,
  getSelectedAction,
  selectAction,
} from "../liveState";
import type { PolicyMode } from "../liveState";
import {
  buildSkillGuardApprovalInstructions,
  deriveSkillGuardAccounts,
  skillGuardBytes32,
} from "../skillguardProgram";
import { colors } from "../theme";
import { ActionDetailScreen } from "./ActionDetailScreen";
import { AgentsScreen } from "./AgentsScreen";
import { InboxScreen } from "./InboxScreen";
import { PermissionEditorScreen } from "./PermissionEditorScreen";
import { ReceiptScreen } from "./ReceiptScreen";

export function WalletConnectScreen() {
  const [mobileState, setMobileState] = useState(emptyMobileState);
  const [status, setStatus] = useState("Wallet not connected");
  const [isBusy, setIsBusy] = useState(false);
  const { account, connect, disconnect, signAndSendTransaction, connection } =
    useMobileWallet();
  const apiClient = useMemo(() => createSkillGuardApiClient(), []);

  const address = account?.publicKey.toBase58();
  const shortAddress = useMemo(() => {
    if (!address) return "No wallet";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);
  const selectedAction = getSelectedAction(mobileState);

  async function refreshWalletState(userWallet: string) {
    const nextState = await apiClient.loadWalletState(userWallet);
    setMobileState(nextState);
    return nextState;
  }

  async function handleConnect() {
    setIsBusy(true);
    setStatus("Opening wallet approval");
    try {
      const connected = await connect();
      const userWallet = connected.publicKey.toBase58();
      setStatus("Registering live agent connection");
      await apiClient.ensureAgentConnection(userWallet);
      const nextState = await refreshWalletState(userWallet);
      setStatus(
        `Connected ${userWallet.slice(0, 8)}... ${nextState.actions.length} live requests`
      );
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
      setMobileState(emptyMobileState);
      setStatus("Wallet disconnected");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRefresh() {
    if (!address) {
      setStatus("Connect a wallet before refreshing live requests");
      return;
    }

    setIsBusy(true);
    setStatus("Refreshing live agent requests");
    try {
      const nextState = await refreshWalletState(address);
      setStatus(`Loaded ${nextState.actions.length} live requests`);
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSignProbe() {
    const actionToApprove = getSelectedAction(mobileState);
    if (!actionToApprove || actionToApprove.status !== "pending") {
      setStatus("Select a pending action to approve");
      return;
    }

    setIsBusy(true);
    setStatus("Preparing SkillGuard receipt");

    try {
      const activeAccount = account ?? (await connect());
      const userWallet = activeAccount.publicKey.toBase58();
      const agentIdHash = skillGuardBytes32("agent", actionToApprove.agentId);
      const actionIdHash = skillGuardBytes32("action", actionToApprove.id);
      const skillGuardAccounts = deriveSkillGuardAccounts(
        activeAccount.publicKey,
        agentIdHash,
        actionIdHash
      );
      const [userProfileInfo, agentConnectionInfo, actionReceiptInfo] =
        await Promise.all([
          connection.getAccountInfo(skillGuardAccounts.userProfile, "confirmed"),
          connection.getAccountInfo(
            skillGuardAccounts.agentConnection,
            "confirmed"
          ),
          connection.getAccountInfo(skillGuardAccounts.actionReceipt, "confirmed"),
        ]);

      if (actionReceiptInfo) {
        setStatus("SkillGuard receipt already exists for this action");
        return;
      }

      const latestBlockhash = await connection.getLatestBlockhash("confirmed");
      const minContextSlot = await connection.getSlot("confirmed");
      const transaction = new Transaction({
        feePayer: activeAccount.publicKey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        ...buildSkillGuardApprovalInstructions({
          actionId: actionToApprove.id,
          agentId: actionToApprove.agentId,
          includeConnectAgent: agentConnectionInfo === null,
          includeCreateUserProfile: userProfileInfo === null,
          manifestHash: actionToApprove.manifestHash,
          owner: activeAccount.publicKey,
          policyResult: actionToApprove.policyResultSummary,
        })
      );

      const txSignature = await signAndSendTransaction(transaction, minContextSlot);
      await apiClient.approveAction(
        actionToApprove.id,
        txSignature,
        skillGuardAccounts.actionReceipt.toBase58()
      );
      await refreshWalletState(userWallet);
      setStatus("SkillGuard receipt recorded on devnet");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRejectSelected() {
    const actionToReject = getSelectedAction(mobileState);
    if (!address || !actionToReject || actionToReject.status !== "pending") {
      setStatus("Select a pending action to reject");
      return;
    }

    setIsBusy(true);
    try {
      await apiClient.rejectAction(actionToReject.id);
      await refreshWalletState(address);
      setStatus("Action rejected by wallet owner");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRevokeAgent() {
    if (!address || !mobileState.agent) {
      setStatus("Connect a wallet before revoking an agent");
      return;
    }

    setIsBusy(true);
    try {
      await apiClient.revokeConnection(mobileState.agent.connectionId);
      await refreshWalletState(address);
      setStatus("Agent revoked. Future requests are blocked.");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePolicyModeChange(mode: PolicyMode) {
    if (!address || !mobileState.agent) {
      setStatus("Connect a wallet before editing permissions");
      return;
    }

    setIsBusy(true);
    try {
      await apiClient.updatePolicyMode(
        mobileState.agent.connectionId,
        mobileState.agent.rawPolicy,
        mode
      );
      await refreshWalletState(address);
      setStatus("Agent policy updated");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  function handleSelectAction(actionId: string) {
    setMobileState((state) => selectAction(state, actionId));
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
            <StatusBadge tone="info" label="devnet" />
            <StatusBadge
              tone={account ? "safe" : "warning"}
              label={account ? "connected" : "approval"}
            />
            <StatusBadge tone="info" label="live api" />
          </View>
          <Text style={styles.heroTitle}>
            {mobileState.actions.length > 0
              ? `${mobileState.agent?.name ?? "Agent"} wants to use your wallet.`
              : "Connect a wallet to control Solana agents."}
          </Text>
          <Text style={styles.heroBody}>
            Review live agent requests, approve only the actions you trust, and
            record a devnet receipt for every wallet approval.
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
          <View style={styles.actionRow}>
            <SecondaryButton
              label="Refresh live requests"
              onPress={handleRefresh}
              disabled={isBusy || !account}
            />
          </View>
        </View>

        {mobileState.agent ? (
          <>
            <AgentsScreen agent={mobileState.agent} onRevoke={handleRevokeAgent} />
            <PermissionEditorScreen
              policy={mobileState.agent.policy}
              onModeChange={handlePolicyModeChange}
            />
          </>
        ) : null}
        <InboxScreen
          actions={mobileState.actions}
          selectedActionId={mobileState.selectedActionId}
          onSelectAction={handleSelectAction}
        />
        {selectedAction ? (
          <ActionDetailScreen
            action={selectedAction}
            isBusy={isBusy}
            onApprove={handleSignProbe}
            onReject={handleRejectSelected}
          />
        ) : (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>No action selected</Text>
            <Text style={styles.emptyBody}>
              Live requests appear here after a connected agent submits an action
              for this wallet.
            </Text>
          </View>
        )}
        <ReceiptScreen actions={mobileState.actions} />
      </ScrollView>
    </SafeAreaView>
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

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 10, marginTop: 18 },
  appName: { color: colors.text, fontSize: 24, fontWeight: "800", letterSpacing: 0 },
  content: { gap: 18, padding: 18, paddingBottom: 36 },
  disabledButton: { opacity: 0.45 },
  emptyBody: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  emptyPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 18,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: "800" },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginTop: 8 },
  headerCopy: { flex: 1 },
  heroBody: { color: colors.textSecondary, fontSize: 15, lineHeight: 22, marginTop: 10 },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 32,
    marginTop: 18,
  },
  heroTopRow: { flexDirection: "row", gap: 8 },
  icon: { height: 48, width: 48 },
  panelLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  pressedButton: { transform: [{ scale: 0.99 }] },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  primaryButtonText: { color: colors.mintText, fontSize: 15, fontWeight: "800" },
  safeArea: { backgroundColor: colors.bg, flex: 1 },
  secondaryButton: {
    alignItems: "center",
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 14,
  },
  secondaryButtonText: { color: colors.text, fontSize: 15, fontWeight: "700" },
  statusText: { color: colors.textSecondary, fontSize: 13, marginTop: 6 },
  tagline: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  walletAddress: { color: colors.text, fontSize: 20, fontWeight: "800", marginTop: 5 },
  walletPanel: {
    backgroundColor: colors.deep,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
  },
});
