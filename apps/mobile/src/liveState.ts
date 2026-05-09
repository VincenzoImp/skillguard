import type {
  ActionManifest,
  AgentPolicy as ProtocolAgentPolicy,
  ApprovalMode,
  DecisionStatus,
  PolicyResult,
  RiskLevel,
} from "@skillguard/protocol";

export type AgentStatus = "active" | "revoked";
export type PolicyMode = ApprovalMode;
export type ActionStatus = DecisionStatus | "pending";
export type RiskTone = "safe" | "warning" | "danger" | "info";

export interface PolicyCheck {
  label: string;
  detail: string;
  tone: RiskTone;
}

export interface AgentPolicy {
  mode: PolicyMode;
  network: string;
  spendLimit: string;
  allowedProtocols: string[];
  permissions: string[];
}

export interface ConnectedAgent {
  connectionId: string;
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  lastSeen: string;
  policy: AgentPolicy;
  rawPolicy: ProtocolAgentPolicy;
}

export interface MobileAction {
  connectionId: string;
  id: string;
  agentId: string;
  title: string;
  summary: string;
  status: ActionStatus;
  risk: RiskTone;
  network: string;
  requestedAt: string;
  manifest: ActionManifest;
  manifestHash: string;
  isOpenExpired?: boolean;
  spend: string;
  checks: PolicyCheck[];
  policyResultSummary: string;
  signature?: string;
  receiptAddress?: string;
  decisionReason?: string;
}

export interface SkillGuardMobileState {
  agent: ConnectedAgent | null;
  agents: ConnectedAgent[];
  selectedActionId: string | null;
  actions: MobileAction[];
}

export interface ToMobileStateOptions {
  now?: number;
}

export interface ApiConnectionRecord {
  connectionId: string;
  agentId: string;
  userWallet: string;
  policy: ProtocolAgentPolicy;
}

export interface ApiAgentRecord {
  agentId: string;
  description: string;
  name: string;
  publicKey?: string;
}

export interface ApiActionRecord {
  actionId: string;
  connectionId: string;
  decisionReceiptAddress?: string | null;
  decisionSignature?: string | null;
  decisionStatus: DecisionStatus | null;
  manifest: ActionManifest;
  policyResult: PolicyResult | null;
}

export const emptyMobileState: SkillGuardMobileState = {
  actions: [],
  agent: null,
  agents: [],
  selectedActionId: null,
};

export function toMobileState(
  {
    actions,
    agents: apiAgents = [],
    connections,
  }: {
    actions: ApiActionRecord[];
    agents?: ApiAgentRecord[];
    connections: ApiConnectionRecord[];
  },
  options: ToMobileStateOptions = {}
): SkillGuardMobileState {
  const now = options.now ?? currentUnixSeconds();
  const agentMetadata = new Map(apiAgents.map((agent) => [agent.agentId, agent]));
  const toAgent = (connection: ApiConnectionRecord) =>
    toConnectedAgent(connection, agentMetadata.get(connection.agentId));
  const activeConnections = connections.filter(isActiveConnection);
  const agents = activeConnections.map(toAgent);
  const primaryConnection = activeConnections[0] ?? null;
  const mobileActions = actions
    .slice()
    .sort((left, right) => right.manifest.createdAt - left.manifest.createdAt)
    .map((action) => toMobileAction(action, now));

  return {
    actions: mobileActions,
    agents,
    agent: primaryConnection ? toAgent(primaryConnection) : null,
    selectedActionId:
      mobileActions.find((action) => action.status === "pending")?.id ??
      mobileActions[0]?.id ??
      null,
  };
}

export function getSelectedAction(state: SkillGuardMobileState): MobileAction | null {
  if (!state.selectedActionId) {
    return null;
  }
  return (
    state.actions.find((item) => item.id === state.selectedActionId) ?? state.actions[0] ?? null
  );
}

export function getPendingActions(state: SkillGuardMobileState): MobileAction[] {
  return state.actions.filter((action) => action.status === "pending");
}

export function getBlockedActions(state: SkillGuardMobileState): MobileAction[] {
  return state.actions.filter((action) => action.status === "blocked");
}

export function getHistoryActions(state: SkillGuardMobileState): MobileAction[] {
  return state.actions.filter(isHistoryAction);
}

export function isHistoryAction(action: MobileAction): boolean {
  return action.status !== "pending" && !action.isOpenExpired;
}

export function selectAction(
  state: SkillGuardMobileState,
  actionId: string
): SkillGuardMobileState {
  if (!state.actions.some((action) => action.id === actionId)) {
    return state;
  }
  return {
    ...state,
    selectedActionId: actionId,
  };
}

function isActiveConnection(connection: ApiConnectionRecord): boolean {
  return connection.policy.active && !connection.policy.revoked;
}

function toConnectedAgent(
  connection: ApiConnectionRecord,
  agentMetadata?: ApiAgentRecord
): ConnectedAgent {
  return {
    connectionId: connection.connectionId,
    description:
      agentMetadata?.description ??
      "Requests Solana wallet actions through SkillGuard policy checks.",
    id: connection.agentId,
    lastSeen: connection.policy.revoked ? "revoked" : "live API",
    name: agentMetadata?.name ?? connection.agentId,
    policy: toPolicyView(connection.policy),
    rawPolicy: connection.policy,
    status: connection.policy.revoked || !connection.policy.active ? "revoked" : "active",
  };
}

function toPolicyView(policy: ProtocolAgentPolicy): AgentPolicy {
  return {
    allowedProtocols: policy.allowedProtocols,
    mode: policy.mode,
    network: policy.allowedNetworks.map(labelNetwork).join(", "),
    permissions: ["Request approvals", "Record approval receipts"],
    spendLimit: `${formatLamports(policy.maxSpendAtomic)} SOL`,
  };
}

function formatLamports(value: string): string {
  const lamports = BigInt(value);
  const whole = lamports / 1_000_000_000n;
  const fraction = lamports % 1_000_000_000n;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(9, "0").replace(/0+$/, "")}`;
}

function toMobileAction(action: ApiActionRecord, now: number): MobileAction {
  const status = action.decisionStatus ?? statusForOpenAction(action.manifest, now);
  const isOpenExpired = action.decisionStatus === null && status === "expired";
  const policyResult = action.policyResult;
  const manifest = action.manifest;
  const risk = riskTone(policyResult?.riskLevel ?? highestManifestRisk(manifest));

  return {
    agentId: manifest.agentId,
    checks: checksForAction(action, status),
    connectionId: action.connectionId,
    decisionReason: decisionReason(action, status),
    id: action.actionId,
    isOpenExpired,
    manifest,
    manifestHash: policyResult?.manifestHash ?? action.actionId,
    network: labelNetwork(manifest.network),
    policyResultSummary: policyResult
      ? `${policyResult.status}:${policyResult.riskLevel}:${policyResult.reasons.join("|")}`
      : "unevaluated",
    receiptAddress: action.decisionReceiptAddress ?? undefined,
    requestedAt: relativeCreatedAt(manifest.createdAt),
    risk,
    signature: action.decisionSignature ?? undefined,
    spend: manifest.spend.map((spend) => spend.human).join(", ") || "0",
    status,
    summary: manifest.summary,
    title: manifest.title,
  };
}

function statusForOpenAction(manifest: ActionManifest, now: number): ActionStatus {
  return manifest.expiresAt <= now ? "expired" : "pending";
}

function checksForAction(action: ApiActionRecord, status: ActionStatus): PolicyCheck[] {
  const checks: PolicyCheck[] = [];
  const result = action.policyResult;

  checks.push({
    detail: `${labelNetwork(action.manifest.network)} action requested by ${action.manifest.agentId}.`,
    label: "Network declared",
    tone: "info",
  });

  for (const signal of action.manifest.riskSignals) {
    checks.push({
      detail: signal.message,
      label: signal.code.replaceAll("_", " "),
      tone: riskTone(signal.level),
    });
  }

  if (!result) {
    if (status === "expired") {
      checks.push({
        detail: "The approval window closed before the wallet owner decided.",
        label: "Manifest expired",
        tone: "danger",
      });
      return checks;
    }

    checks.push({
      detail: "The API has not returned a policy result for this request yet.",
      label: "Awaiting policy evaluation",
      tone: "warning",
    });
    return checks;
  }

  if (result.status === "pass") {
    checks.push({
      detail: "Policy allows this action under the configured limits.",
      label: "Policy passed",
      tone: "safe",
    });
  }

  for (const reason of result.reasons) {
    checks.push(policyReasonCheck(reason));
  }

  return checks;
}

function policyReasonCheck(reason: string): PolicyCheck {
  if (reason === "policy_requires_manual_approval") {
    return {
      detail: "The wallet owner must approve this request before execution.",
      label: "User approval required",
      tone: "warning",
    };
  }
  if (reason === "spend_exceeds_max") {
    return {
      detail: "The requested spend is above the connected agent policy.",
      label: "Spend exceeds limit",
      tone: "danger",
    };
  }
  if (reason === "policy_revoked") {
    return {
      detail: "The wallet owner revoked this agent connection.",
      label: "Agent revoked",
      tone: "danger",
    };
  }
  if (reason === "policy_inactive") {
    return {
      detail: "The current agent policy is inactive.",
      label: "Policy inactive",
      tone: "danger",
    };
  }
  if (reason === "policy_mode_block") {
    return {
      detail: "The wallet owner switched this agent to block mode.",
      label: "Policy set to block",
      tone: "danger",
    };
  }
  if (reason === "manifest_expired") {
    return {
      detail: "The agent request expired before approval.",
      label: "Manifest expired",
      tone: "danger",
    };
  }
  if (reason.startsWith("protocol_not_allowed:")) {
    return {
      detail: reason.replace("protocol_not_allowed:", ""),
      label: "Protocol not allowed",
      tone: "danger",
    };
  }
  if (reason.startsWith("network_not_allowed:")) {
    return {
      detail: reason.replace("network_not_allowed:", ""),
      label: "Network not allowed",
      tone: "danger",
    };
  }
  if (reason.startsWith("mint_not_allowed:")) {
    return {
      detail: reason.replace("mint_not_allowed:", ""),
      label: "Mint not allowed",
      tone: "danger",
    };
  }
  if (reason === "raw_transaction_requires_approval") {
    return {
      detail: "Raw transaction references always require explicit wallet approval.",
      label: "Raw transaction requires approval",
      tone: "warning",
    };
  }
  return {
    detail: reason,
    label: "Policy reason",
    tone: "warning",
  };
}

function decisionReason(
  action: ApiActionRecord,
  status: ActionStatus
): string | undefined {
  if (action.decisionStatus === "approved" && action.decisionSignature) {
    return "Approved by wallet owner.";
  }
  if (action.decisionStatus === "approved") {
    return "Automatically approved under policy.";
  }
  if (action.decisionStatus === "rejected") {
    return "Rejected by wallet owner.";
  }
  if (action.decisionStatus === "blocked") {
    if (action.policyResult?.reasons.includes("spend_exceeds_max")) {
      return "Spend exceeds policy limit.";
    }
    if (action.policyResult?.reasons.includes("policy_revoked")) {
      return "Agent revoked by wallet owner.";
    }
    return "Blocked by policy.";
  }
  if (action.decisionStatus === "expired") {
    return "Agent request expired.";
  }
  if (status === "expired") {
    return "Agent request expired.";
  }
  return undefined;
}

function riskTone(risk: RiskLevel): RiskTone {
  if (risk === "high") return "danger";
  if (risk === "medium") return "warning";
  return "safe";
}

function highestManifestRisk(manifest: ActionManifest): RiskLevel {
  if (manifest.riskSignals.some((signal) => signal.level === "high")) return "high";
  if (manifest.riskSignals.some((signal) => signal.level === "medium")) return "medium";
  return "low";
}

function labelNetwork(network: ActionManifest["network"]): string {
  if (network === "solana-mainnet") return "Solana mainnet";
  return "Solana devnet";
}

function relativeCreatedAt(createdAt: number): string {
  const deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000) - createdAt);
  if (deltaSeconds < 60) return `${deltaSeconds} sec ago`;
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)} min ago`;
  if (deltaSeconds < 86_400) return `${Math.floor(deltaSeconds / 3600)} hr ago`;
  return `${Math.floor(deltaSeconds / 86_400)} days ago`;
}

function currentUnixSeconds(): number {
  return Math.floor(Date.now() / 1000);
}
