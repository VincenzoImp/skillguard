import "../polyfills";

import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Transaction } from "@solana/web3.js";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import type { AppTabId } from "../appNavigation";
import {
  buildDashboardSummary,
  buildTabItems,
  recommendedInitialTab,
} from "../appNavigation";
import { StatusBadge } from "../components/StatusBadge";
import { buildAgentPolicyInput, parseAgentPairingInput } from "../agentPolicyForm";
import { createSkillGuardApiClient } from "../liveApi";
import {
  emptyMobileState,
  getSelectedAction,
  selectAction,
} from "../liveState";
import type { AgentPolicy, PolicyMode, SkillGuardMobileState } from "../liveState";
import {
  buildSkillGuardApprovalInstructions,
  deriveSkillGuardAccounts,
  skillGuardBytes32,
} from "../skillguardProgram";
import { colors, labelForPolicyMode } from "../theme";
import { ActionDetailScreen } from "./ActionDetailScreen";
import { AgentsScreen } from "./AgentsScreen";
import { InboxScreen } from "./InboxScreen";
import { PermissionEditorScreen } from "./PermissionEditorScreen";
import { ReceiptScreen } from "./ReceiptScreen";

export function WalletConnectScreen() {
  const [mobileState, setMobileState] = useState(emptyMobileState);
  const [activeTab, setActiveTab] = useState<AppTabId>("home");
  const [status, setStatus] = useState("Wallet not connected");
  const [isBusy, setIsBusy] = useState(false);
  const [walletSession, setWalletSession] = useState<{
    token: string;
    wallet: string;
  } | null>(null);
  const [agentIdInput, setAgentIdInput] = useState("");
  const [agentNameInput, setAgentNameInput] = useState("");
  const [agentDescriptionInput, setAgentDescriptionInput] = useState("");
  const [agentPublicKeyInput, setAgentPublicKeyInput] = useState("");
  const [agentPolicyMode, setAgentPolicyMode] =
    useState<PolicyMode>("ask_every_time");
  const [allowedMintsInput, setAllowedMintsInput] = useState("SOL,USDC");
  const [allowedProtocolsInput, setAllowedProtocolsInput] =
    useState("helius,birdeye");
  const [dailySpendInput, setDailySpendInput] = useState("5");
  const [maxSpendInput, setMaxSpendInput] = useState("1");
  const { account, connect, disconnect, signAndSendTransaction, signMessage, connection } =
    useMobileWallet();
  const apiClient = useMemo(() => createSkillGuardApiClient(), []);

  const address = account?.publicKey.toBase58();
  const shortAddress = useMemo(() => {
    if (!address) return "No wallet";
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }, [address]);
  const selectedAction = getSelectedAction(mobileState);
  const summary = buildDashboardSummary(mobileState);
  const tabs = buildTabItems(mobileState, Boolean(address));

  useEffect(() => {
    let cancelled = false;

    async function loadRestoredSession() {
      if (!address) {
        setMobileState(emptyMobileState);
        setWalletSession(null);
        setActiveTab("home");
        setStatus("Wallet not connected");
        return;
      }

      setStatus("Signing wallet session and loading live SkillGuard state.");
      try {
        const sessionToken = await ensureWalletSession(address);
        const nextState = await apiClient.loadWalletState(address, sessionToken);
        if (!cancelled) {
          setMobileState(nextState);
          setActiveTab((currentTab) =>
            currentTab === "home" || currentTab === "pairing"
              ? recommendedInitialTab(nextState, true)
              : currentTab
          );
          setStatus(
            `Loaded ${nextState.agents.length} agents and ${nextState.actions.length} live requests`
          );
        }
      } catch (error) {
        if (!cancelled) {
          setStatus(readError(error));
        }
      }
    }

    loadRestoredSession();

    return () => {
      cancelled = true;
    };
  }, [address, apiClient, signMessage, walletSession]);

  async function refreshWalletState(userWallet: string) {
    const sessionToken = await ensureWalletSession(userWallet);
    const nextState = await apiClient.loadWalletState(userWallet, sessionToken);
    setMobileState(nextState);
    return nextState;
  }

  async function ensureWalletSession(userWallet: string) {
    if (walletSession?.wallet === userWallet) {
      return walletSession.token;
    }
    const session = await apiClient.createWalletSession(userWallet, signMessage);
    setWalletSession({ token: session.token, wallet: userWallet });
    return session.token;
  }

  async function handleConnect() {
    setIsBusy(true);
    setStatus("Opening wallet approval");
    try {
      const connected = await connect();
      const userWallet = connected.publicKey.toBase58();
      setStatus("Loading live SkillGuard state");
      const nextState = await refreshWalletState(userWallet);
      setActiveTab(recommendedInitialTab(nextState, true));
      setStatus(
        `Connected ${userWallet.slice(0, 8)}... ${nextState.agents.length} agents, ${nextState.actions.length} requests`
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
      setWalletSession(null);
      setMobileState(emptyMobileState);
      setActiveTab("home");
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
        actionToApprove.connectionId,
        txSignature,
        skillGuardAccounts.actionReceipt.toBase58(),
        userWallet,
        signMessage
      );
      await refreshWalletState(userWallet);
      setActiveTab("activity");
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
      await apiClient.rejectAction(
        actionToReject.id,
        actionToReject.connectionId,
        address,
        signMessage
      );
      await refreshWalletState(address);
      setActiveTab("activity");
      setStatus("Action rejected by wallet owner");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function revokeConnection(connectionId: string) {
    if (!address) {
      setStatus("Connect a wallet before revoking an agent");
      return;
    }

    setIsBusy(true);
    try {
      await apiClient.revokeConnection(connectionId, address, signMessage);
      await refreshWalletState(address);
      setActiveTab("agents");
      setStatus("Agent revoked. Future requests are blocked.");
    } catch (error) {
      setStatus(readError(error));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleConnectAgent() {
    if (!address) {
      setStatus("Connect a wallet before adding an agent");
      setActiveTab("home");
      return;
    }

    const agentId = agentIdInput.trim();
    const name = agentNameInput.trim();
    const description = agentDescriptionInput.trim();
    if (!agentId || !name || !description) {
      setStatus("Agent ID, name, and description are required");
      return;
    }

    setIsBusy(true);
    try {
      const policyInput = buildAgentPolicyInput({
        allowedMints: allowedMintsInput,
        allowedProtocols: allowedProtocolsInput,
        dailySpendUsdc: dailySpendInput,
        maxSpendUsdc: maxSpendInput,
        mode: agentPolicyMode,
      });
      await apiClient.connectAgent(
        address,
        {
          agentId,
          description,
          name,
          publicKey: agentPublicKeyInput.trim() || undefined,
        },
        policyInput,
        signMessage
      );
      const nextState = await refreshWalletState(address);
      setActiveTab("agents");
      setStatus(
        `Imported agent ${agentId}. ${nextState.agents.length} agents now controlled.`
      );
      setAgentIdInput("");
      setAgentNameInput("");
      setAgentDescriptionInput("");
      setAgentPublicKeyInput("");
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
        mode,
        address,
        signMessage
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
    setActiveTab("inbox");
  }

  function handleAgentIdInputChange(value: string) {
    const pairing = parseAgentPairingInput(value);
    if (!pairing) {
      setAgentIdInput(value);
      return;
    }

    setAgentIdInput(pairing.agentId);
    setAgentNameInput(pairing.name);
    setAgentDescriptionInput(pairing.description);
    setAgentPublicKeyInput(pairing.publicKey ?? "");
    if (pairing.allowedProtocols) {
      setAllowedProtocolsInput(pairing.allowedProtocols);
    }
    setStatus("Pairing link loaded. Review limits, then sign to import.");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.shell}>
        <AppHeader
          addressLabel={shortAddress}
          isConnected={Boolean(account)}
          status={status}
        />
        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === "home" ? (
            <HomePage
              address={address}
              isBusy={isBusy}
              mobileState={mobileState}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onGoPairing={() => setActiveTab("pairing")}
              onGoInbox={() => setActiveTab("inbox")}
              onRefresh={handleRefresh}
              shortAddress={shortAddress}
              summary={summary}
            />
          ) : null}
          {activeTab === "inbox" ? (
            <InboxPage
              actions={mobileState.actions}
              isBusy={isBusy}
              onApprove={handleSignProbe}
              onReject={handleRejectSelected}
              onSelectAction={handleSelectAction}
              selectedAction={selectedAction}
              selectedActionId={mobileState.selectedActionId}
            />
          ) : null}
          {activeTab === "agents" ? (
            <AgentsPage
              agents={mobileState.agents}
              connected={Boolean(address)}
              onGoPairing={() => setActiveTab("pairing")}
              onModeChange={handlePolicyModeChange}
              onRevoke={revokeConnection}
              policy={mobileState.agent?.policy ?? null}
            />
          ) : null}
          {activeTab === "pairing" ? (
            <PairingPage
              address={address}
              agentDescriptionInput={agentDescriptionInput}
              agentIdInput={agentIdInput}
              agentNameInput={agentNameInput}
              agentPolicyMode={agentPolicyMode}
              agentPublicKeyInput={agentPublicKeyInput}
              allowedMintsInput={allowedMintsInput}
              allowedProtocolsInput={allowedProtocolsInput}
              dailySpendInput={dailySpendInput}
              isBusy={isBusy}
              maxSpendInput={maxSpendInput}
              onAgentDescriptionChange={setAgentDescriptionInput}
              onAgentIdChange={handleAgentIdInputChange}
              onAgentNameChange={setAgentNameInput}
              onAgentPolicyModeChange={setAgentPolicyMode}
              onAgentPublicKeyChange={setAgentPublicKeyInput}
              onAllowedMintsChange={setAllowedMintsInput}
              onAllowedProtocolsChange={setAllowedProtocolsInput}
              onConnect={handleConnect}
              onDailySpendChange={setDailySpendInput}
              onImport={handleConnectAgent}
              onMaxSpendChange={setMaxSpendInput}
            />
          ) : null}
          {activeTab === "activity" ? <ReceiptScreen actions={mobileState.actions} /> : null}
        </ScrollView>
        <TabBar activeTab={activeTab} onChange={setActiveTab} tabs={tabs} />
      </View>
    </SafeAreaView>
  );
}

function AppHeader({
  addressLabel,
  isConnected,
  status,
}: {
  addressLabel: string;
  isConnected: boolean;
  status: string;
}) {
  return (
    <View style={styles.header}>
      <Image
        source={require("../../assets/icon.png")}
        style={styles.icon}
        resizeMode="contain"
      />
      <View style={styles.headerCopy}>
        <Text style={styles.appName}>SkillGuard</Text>
        <Text style={styles.statusText} numberOfLines={1}>
          {status}
        </Text>
      </View>
      <View style={styles.headerWallet}>
        <StatusBadge tone={isConnected ? "safe" : "warning"} label={isConnected ? "live" : "idle"} />
        <Text style={styles.walletMini}>{addressLabel}</Text>
      </View>
    </View>
  );
}

function HomePage({
  address,
  isBusy,
  mobileState,
  onConnect,
  onDisconnect,
  onGoInbox,
  onGoPairing,
  onRefresh,
  shortAddress,
  summary,
}: {
  address: string | undefined;
  isBusy: boolean;
  mobileState: SkillGuardMobileState;
  onConnect: () => void;
  onDisconnect: () => void;
  onGoInbox: () => void;
  onGoPairing: () => void;
  onRefresh: () => void;
  shortAddress: string;
  summary: ReturnType<typeof buildDashboardSummary>;
}) {
  const heroTitle = !address
    ? "Control agent access before a wallet signs."
    : summary.pendingActions > 0
      ? `${summary.pendingActions} request${summary.pendingActions === 1 ? "" : "s"} need review.`
      : summary.activeAgents > 0
        ? "Your wallet is guarded."
        : "Pair your first agent.";

  return (
    <View style={styles.pageStack}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <StatusBadge tone="info" label="devnet" />
          <StatusBadge tone="info" label="live api" />
        </View>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="Pending" value={summary.pendingActions.toString()} tone="warning" />
        <MetricCard label="Agents" value={summary.activeAgents.toString()} tone="safe" />
        <MetricCard label="Blocked" value={summary.blockedActions.toString()} tone="danger" />
        <MetricCard label="Actions" value={summary.totalActions.toString()} tone="info" />
      </View>

      <View style={styles.walletPanel}>
        <Text style={styles.panelLabel}>Wallet</Text>
        <Text style={styles.walletAddress}>{shortAddress}</Text>
        <View style={styles.actionRow}>
          <PrimaryButton
            label={address ? "Refresh" : "Connect wallet"}
            onPress={address ? onRefresh : onConnect}
            disabled={isBusy}
          />
          {address ? (
            <SecondaryButton
              label="Disconnect"
              onPress={onDisconnect}
              disabled={isBusy}
            />
          ) : null}
        </View>
      </View>

      <View style={styles.quickGrid}>
        <QuickAction
          body={summary.pendingActions > 0 ? "Open approval queue" : "No pending requests"}
          disabled={!address || summary.pendingActions === 0}
          label="Review"
          onPress={onGoInbox}
        />
        <QuickAction
          body="Import by pairing link"
          disabled={!address}
          label="Pair"
          onPress={onGoPairing}
        />
      </View>
    </View>
  );
}

function InboxPage({
  actions,
  isBusy,
  onApprove,
  onReject,
  onSelectAction,
  selectedAction,
  selectedActionId,
}: {
  actions: SkillGuardMobileState["actions"];
  isBusy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSelectAction: (actionId: string) => void;
  selectedAction: SkillGuardMobileState["actions"][number] | null;
  selectedActionId: string | null;
}) {
  return (
    <View style={styles.pageStack}>
      <InboxScreen
        actions={actions}
        selectedActionId={selectedActionId}
        onSelectAction={onSelectAction}
      />
      {selectedAction ? (
        <ActionDetailScreen
          action={selectedAction}
          isBusy={isBusy}
          onApprove={onApprove}
          onReject={onReject}
        />
      ) : (
        <EmptyPanel
          title="No action selected"
          body="Live requests appear after a paired agent submits an action for this wallet."
        />
      )}
    </View>
  );
}

function AgentsPage({
  agents,
  connected,
  onGoPairing,
  onModeChange,
  onRevoke,
  policy,
}: {
  agents: SkillGuardMobileState["agents"];
  connected: boolean;
  onGoPairing: () => void;
  onModeChange: (mode: PolicyMode) => void;
  onRevoke: (connectionId: string) => void;
  policy: AgentPolicy | null;
}) {
  if (!connected) {
    return (
      <EmptyPanel
        title="Connect a wallet first"
        body="Agent permissions are scoped to a wallet owner session."
      />
    );
  }

  if (agents.length === 0) {
    return (
      <View style={styles.pageStack}>
        <EmptyPanel
          title="No paired agents"
          body="Only agents imported by this wallet can submit requests."
        />
        <PrimaryButton label="Import agent" onPress={onGoPairing} />
      </View>
    );
  }

  return (
    <View style={styles.pageStack}>
      <AgentsScreen agents={agents} onRevoke={onRevoke} />
      {policy ? (
        <PermissionEditorScreen policy={policy} onModeChange={onModeChange} />
      ) : null}
    </View>
  );
}

function PairingPage({
  address,
  agentDescriptionInput,
  agentIdInput,
  agentNameInput,
  agentPolicyMode,
  agentPublicKeyInput,
  allowedMintsInput,
  allowedProtocolsInput,
  dailySpendInput,
  isBusy,
  maxSpendInput,
  onAgentDescriptionChange,
  onAgentIdChange,
  onAgentNameChange,
  onAgentPolicyModeChange,
  onAgentPublicKeyChange,
  onAllowedMintsChange,
  onAllowedProtocolsChange,
  onConnect,
  onDailySpendChange,
  onImport,
  onMaxSpendChange,
}: {
  address: string | undefined;
  agentDescriptionInput: string;
  agentIdInput: string;
  agentNameInput: string;
  agentPolicyMode: PolicyMode;
  agentPublicKeyInput: string;
  allowedMintsInput: string;
  allowedProtocolsInput: string;
  dailySpendInput: string;
  isBusy: boolean;
  maxSpendInput: string;
  onAgentDescriptionChange: (value: string) => void;
  onAgentIdChange: (value: string) => void;
  onAgentNameChange: (value: string) => void;
  onAgentPolicyModeChange: (value: PolicyMode) => void;
  onAgentPublicKeyChange: (value: string) => void;
  onAllowedMintsChange: (value: string) => void;
  onAllowedProtocolsChange: (value: string) => void;
  onConnect: () => void;
  onDailySpendChange: (value: string) => void;
  onImport: () => void;
  onMaxSpendChange: (value: string) => void;
}) {
  if (!address) {
    return (
      <View style={styles.pageStack}>
        <EmptyPanel
          title="Wallet signature required"
          body="Pairing creates an owner-signed permission grant for one wallet."
        />
        <PrimaryButton disabled={isBusy} label="Connect wallet" onPress={onConnect} />
      </View>
    );
  }

  return (
    <View style={styles.agentFormPanel}>
      <Text style={styles.panelLabel}>Pair agent</Text>
      <Text style={styles.formHelp}>
        Paste a SkillGuard pairing link. Review limits before signing the import.
      </Text>
      <Text style={styles.fieldLabel}>Agent ID or pairing link</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isBusy}
        onChangeText={onAgentIdChange}
        placeholder="skillguard://pair?agentId=..."
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={agentIdInput}
      />
      <Text style={styles.fieldLabel}>Display name</Text>
      <TextInput
        editable={!isBusy}
        onChangeText={onAgentNameChange}
        placeholder="Agent name"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={agentNameInput}
      />
      <Text style={styles.fieldLabel}>Allowed purpose</Text>
      <TextInput
        editable={!isBusy}
        multiline
        onChangeText={onAgentDescriptionChange}
        placeholder="What this agent is allowed to request"
        placeholderTextColor={colors.textMuted}
        style={[styles.input, styles.textArea]}
        value={agentDescriptionInput}
      />
      <Text style={styles.fieldLabel}>Agent public key</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isBusy}
        onChangeText={onAgentPublicKeyChange}
        placeholder="Required for new agents"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={agentPublicKeyInput}
      />
      <Text style={styles.fieldLabel}>Approval mode</Text>
      <PolicyModeSelector
        disabled={isBusy}
        mode={agentPolicyMode}
        onChange={onAgentPolicyModeChange}
      />
      <View style={styles.policyGrid}>
        <View style={styles.policyField}>
          <Text style={styles.fieldLabel}>Max spend per action</Text>
          <TextInput
            editable={!isBusy}
            keyboardType="decimal-pad"
            onChangeText={onMaxSpendChange}
            placeholder="1"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={maxSpendInput}
          />
        </View>
        <View style={styles.policyField}>
          <Text style={styles.fieldLabel}>Daily cap</Text>
          <TextInput
            editable={!isBusy}
            keyboardType="decimal-pad"
            onChangeText={onDailySpendChange}
            placeholder="5"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={dailySpendInput}
          />
        </View>
      </View>
      <Text style={styles.fieldLabel}>Allowed protocols</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isBusy}
        onChangeText={onAllowedProtocolsChange}
        placeholder="helius,birdeye"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={allowedProtocolsInput}
      />
      <Text style={styles.fieldLabel}>Allowed mints</Text>
      <TextInput
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!isBusy}
        onChangeText={onAllowedMintsChange}
        placeholder="SOL,USDC"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={allowedMintsInput}
      />
      <PrimaryButton disabled={isBusy} label="Sign & import agent" onPress={onImport} />
    </View>
  );
}

function PolicyModeSelector({
  disabled,
  mode,
  onChange,
}: {
  disabled?: boolean;
  mode: PolicyMode;
  onChange: (mode: PolicyMode) => void;
}) {
  const modes: PolicyMode[] = ["ask_every_time", "allow_under_limits", "block"];
  return (
    <View style={styles.modeSelector}>
      {modes.map((item) => (
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          key={item}
          onPress={() => onChange(item)}
          style={[
            styles.modeOption,
            mode === item ? styles.modeOptionActive : null,
            disabled ? styles.disabledButton : null,
          ]}
        >
          <Text
            style={[
              styles.modeOptionText,
              mode === item ? styles.modeOptionTextActive : null,
            ]}
          >
            {labelForPolicyMode(item)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function TabBar({
  activeTab,
  onChange,
  tabs,
}: {
  activeTab: AppTabId;
  onChange: (tab: AppTabId) => void;
  tabs: ReturnType<typeof buildTabItems>;
}) {
  return (
    <View style={styles.tabBar}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <Pressable
            accessibilityRole="button"
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={[styles.tabItem, isActive ? styles.tabItemActive : null]}
          >
            <Text style={[styles.tabText, isActive ? styles.tabTextActive : null]}>
              {tab.label}
            </Text>
            {tab.badge ? (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>{tab.badge}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function MetricCard({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "info" | "safe" | "warning";
  value: string;
}) {
  const toneStyle = {
    danger: styles.metricDanger,
    info: styles.metricInfo,
    safe: styles.metricSafe,
    warning: styles.metricWarning,
  }[tone];
  return (
    <View style={[styles.metricCard, toneStyle]}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  body,
  disabled,
  label,
  onPress,
}: {
  body: string;
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
        styles.quickCard,
        disabled ? styles.disabledButton : null,
        pressed && !disabled ? styles.pressedButton : null,
      ]}
    >
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickBody}>{body}</Text>
    </Pressable>
  );
}

function EmptyPanel({ body, title }: { body: string; title: string }) {
  return (
    <View style={styles.emptyPanel}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
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

const styles = StyleSheet.create({
  actionRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  agentFormPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 18,
  },
  appName: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: 0 },
  content: { gap: 18, padding: 18, paddingBottom: 24 },
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
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  formHelp: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerCopy: { flex: 1 },
  headerWallet: { alignItems: "flex-end", gap: 6 },
  heroCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 32,
    marginTop: 18,
  },
  heroTopRow: { flexDirection: "row", gap: 8 },
  icon: { height: 44, width: 44 },
  input: {
    backgroundColor: colors.deep,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metricCard: {
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 76,
    minWidth: "47%",
    padding: 12,
  },
  metricDanger: {
    backgroundColor: "rgba(255,90,104,0.09)",
    borderColor: "rgba(255,90,104,0.28)",
  },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 18 },
  metricInfo: {
    backgroundColor: "rgba(88,166,255,0.08)",
    borderColor: "rgba(88,166,255,0.24)",
  },
  metricLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  metricSafe: {
    backgroundColor: "rgba(0,240,168,0.08)",
    borderColor: "rgba(0,240,168,0.24)",
  },
  metricValue: { color: colors.text, fontSize: 25, fontWeight: "800", marginBottom: 5 },
  metricWarning: {
    backgroundColor: "rgba(245,184,75,0.1)",
    borderColor: "rgba(245,184,75,0.28)",
  },
  modeOption: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: 7,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  modeOptionActive: {
    backgroundColor: "rgba(0,240,168,0.12)",
    borderColor: "rgba(0,240,168,0.38)",
  },
  modeOptionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modeOptionTextActive: { color: colors.mint },
  modeSelector: {
    backgroundColor: colors.deep,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 4,
    padding: 4,
  },
  pageStack: { gap: 16 },
  panelLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  policyField: { flex: 1, gap: 6 },
  policyGrid: { flexDirection: "row", gap: 10 },
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
  quickBody: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 6 },
  quickCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 92,
    padding: 14,
  },
  quickGrid: { flexDirection: "row", gap: 10 },
  quickLabel: { color: colors.text, fontSize: 17, fontWeight: "800" },
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
  shell: { flex: 1 },
  statusText: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  tabBadge: {
    alignItems: "center",
    backgroundColor: colors.mint,
    borderRadius: 9,
    minWidth: 18,
    paddingHorizontal: 5,
    paddingVertical: 1,
    position: "absolute",
    right: 8,
    top: 6,
  },
  tabBadgeText: { color: colors.mintText, fontSize: 10, fontWeight: "900" },
  tabBar: {
    backgroundColor: colors.deep,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabItem: {
    alignItems: "center",
    borderRadius: 9,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  tabItemActive: { backgroundColor: colors.surfaceActive },
  tabText: { color: colors.textMuted, fontSize: 12, fontWeight: "800" },
  tabTextActive: { color: colors.text },
  textArea: { minHeight: 82, textAlignVertical: "top" },
  walletAddress: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 5 },
  walletMini: { color: colors.textMuted, fontSize: 11, fontWeight: "700" },
  walletPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: 18,
  },
});
