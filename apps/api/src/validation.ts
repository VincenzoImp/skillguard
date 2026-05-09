import type { ActionManifest, AgentPolicy, DecisionStatus } from "@skillguard/protocol";
import type { AgentRecord, ConnectionRecord } from "./store.js";

type JsonRecord = Record<string, unknown>;

export function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isDecisionStatus(value: unknown): value is DecisionStatus {
  return (
    value === "approved" || value === "rejected" || value === "blocked" || value === "expired"
  );
}

export function parseAgentRecord(value: unknown): AgentRecord | null {
  if (!isRecord(value)) return null;
  if (
    !hasText(value.agentId) ||
    !hasText(value.description) ||
    !hasText(value.name) ||
    !hasText(value.publicKey)
  ) {
    return null;
  }

  return {
    agentId: value.agentId,
    description: value.description,
    name: value.name,
    publicKey: value.publicKey,
  };
}

export function parseConnectionRecord(value: unknown): ConnectionRecord | null {
  if (!isRecord(value)) return null;
  if (!hasText(value.agentId) || !hasText(value.connectionId) || !hasText(value.userWallet)) {
    return null;
  }
  if (!isAgentPolicy(value.policy)) {
    return null;
  }
  if (value.policy.agentId !== value.agentId || value.policy.userWallet !== value.userWallet) {
    return null;
  }

  return {
    agentId: value.agentId,
    connectionId: value.connectionId,
    policy: value.policy,
    userWallet: value.userWallet,
  };
}

export function parseActionPostBody(value: unknown): {
  agentProof: unknown;
  connectionId: string;
  manifest: ActionManifest;
} | null {
  if (!isRecord(value)) return null;
  if (!hasText(value.connectionId) || !isActionManifest(value.manifest)) {
    return null;
  }

  return {
    agentProof: value.agentProof,
    connectionId: value.connectionId,
    manifest: value.manifest,
  };
}

export function parsePolicyPatch(value: unknown): Partial<AgentPolicy> | null {
  if (!isRecord(value)) return null;
  const patch = isRecord(value.policyPatch) ? value.policyPatch : value;
  const next: Partial<AgentPolicy> = {};

  for (const key of Object.keys(patch)) {
    if (
      key !== "allowedMints" &&
      key !== "allowedNetworks" &&
      key !== "allowedProtocols" &&
      key !== "dailySpendCapAtomic" &&
      key !== "expiresAt" &&
      key !== "maxSpendAtomic" &&
      key !== "mode"
    ) {
      return null;
    }
  }

  if ("allowedMints" in patch) {
    if (!Array.isArray(patch.allowedMints) || !patch.allowedMints.every(isMint)) return null;
    next.allowedMints = patch.allowedMints;
  }
  if ("allowedNetworks" in patch) {
    if (!Array.isArray(patch.allowedNetworks) || !patch.allowedNetworks.every(isNetwork)) return null;
    next.allowedNetworks = patch.allowedNetworks;
  }
  if ("allowedProtocols" in patch) {
    if (!isStringArray(patch.allowedProtocols)) return null;
    next.allowedProtocols = patch.allowedProtocols;
  }
  if ("dailySpendCapAtomic" in patch) {
    if (!isAtomicString(patch.dailySpendCapAtomic)) return null;
    next.dailySpendCapAtomic = patch.dailySpendCapAtomic;
  }
  if ("expiresAt" in patch) {
    if (typeof patch.expiresAt !== "number" || !Number.isSafeInteger(patch.expiresAt)) return null;
    next.expiresAt = patch.expiresAt;
  }
  if ("maxSpendAtomic" in patch) {
    if (!isAtomicString(patch.maxSpendAtomic)) return null;
    next.maxSpendAtomic = patch.maxSpendAtomic;
  }
  if ("mode" in patch) {
    if (!isApprovalMode(patch.mode)) return null;
    next.mode = patch.mode;
  }

  return Object.keys(next).length > 0 ? next : null;
}

export function manifestMatchesConnection(
  manifest: ActionManifest,
  connection: ConnectionRecord,
): boolean {
  return manifest.agentId === connection.agentId && manifest.userWallet === connection.userWallet;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(hasText);
}

function isMint(value: unknown): value is "SOL" | "USDC" {
  return value === "SOL" || value === "USDC";
}

function isNetwork(value: unknown): value is ActionManifest["network"] {
  return value === "solana-devnet" || value === "solana-mainnet";
}

function isApprovalMode(value: unknown): value is AgentPolicy["mode"] {
  return value === "ask_every_time" || value === "allow_under_limits" || value === "block";
}

function isActionKind(value: unknown): value is ActionManifest["kind"] {
  return value === "wallet_risk_report" || value === "swap_preview" || value === "receipt_only";
}

function isRiskLevel(value: unknown): value is ActionManifest["riskSignals"][number]["level"] {
  return value === "low" || value === "medium" || value === "high";
}

function isAtomicString(value: unknown): value is string {
  return typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value);
}

function isSpendItem(value: unknown): value is ActionManifest["spend"][number] {
  return (
    isRecord(value) &&
    isMint(value.mint) &&
    isAtomicString(value.amountAtomic) &&
    hasText(value.human) &&
    hasText(value.reason)
  );
}

function isRiskSignal(value: unknown): value is ActionManifest["riskSignals"][number] {
  return (
    isRecord(value) &&
    isRiskLevel(value.level) &&
    hasText(value.code) &&
    hasText(value.message)
  );
}

function isActionManifest(value: unknown): value is ActionManifest {
  return (
    isRecord(value) &&
    value.schemaVersion === "skillguard.action.v1" &&
    hasText(value.actionId) &&
    hasText(value.agentId) &&
    hasText(value.userWallet) &&
    isNetwork(value.network) &&
    isActionKind(value.kind) &&
    hasText(value.title) &&
    hasText(value.summary) &&
    isStringArray(value.protocols) &&
    Array.isArray(value.spend) &&
    value.spend.every(isSpendItem) &&
    isStringArray(value.accountsTouched) &&
    Array.isArray(value.riskSignals) &&
    value.riskSignals.every(isRiskSignal) &&
    (value.rawTransactionRef === null || hasText(value.rawTransactionRef)) &&
    typeof value.createdAt === "number" &&
    typeof value.expiresAt === "number" &&
    Number.isSafeInteger(value.createdAt) &&
    Number.isSafeInteger(value.expiresAt) &&
    value.expiresAt > value.createdAt
  );
}

function isAgentPolicy(value: unknown): value is AgentPolicy {
  return (
    isRecord(value) &&
    hasText(value.policyId) &&
    hasText(value.agentId) &&
    hasText(value.userWallet) &&
    isApprovalMode(value.mode) &&
    typeof value.active === "boolean" &&
    typeof value.revoked === "boolean" &&
    Array.isArray(value.allowedNetworks) &&
    value.allowedNetworks.every(isNetwork) &&
    isStringArray(value.allowedProtocols) &&
    Array.isArray(value.allowedMints) &&
    value.allowedMints.every(isMint) &&
    isAtomicString(value.maxSpendAtomic) &&
    isAtomicString(value.dailySpendCapAtomic) &&
    Number.isSafeInteger(value.expiresAt)
  );
}
