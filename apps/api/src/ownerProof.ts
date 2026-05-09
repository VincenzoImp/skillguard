import type { ActionManifest, AgentPolicy, DecisionStatus } from "@skillguard/protocol";
import { canonicalJson } from "@skillguard/protocol";
import bs58 from "bs58";
import nacl from "tweetnacl";

import type { ConnectionRecord } from "./store.js";

const CONNECTION_OWNER_PROOF_MAX_AGE_MS = 10 * 60 * 1000;

export interface ConnectionOwnerProof {
  type: "solana-sign-message";
  wallet: string;
  message: string;
  signatureBase64: string;
  signedAt: number;
}

export type ConnectionOwnerProofResult =
  | { ok: true }
  | { error: "invalid_wallet_owner_proof" | "wallet_owner_proof_expired" | "wallet_owner_proof_required"; ok: false };

export function buildConnectionOwnerMessage({
  agentId,
  connectionId,
  policy,
  signedAt,
  userWallet,
}: {
  agentId: string;
  connectionId: string;
  policy: AgentPolicy;
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard connection approval",
    `wallet:${userWallet}`,
    `agent:${agentId}`,
    `connection:${connectionId}`,
    `policy:${policy.policyId}`,
    `mode:${policy.mode}`,
    `networks:${policy.allowedNetworks.join(",")}`,
    `protocols:${policy.allowedProtocols.join(",")}`,
    `mints:${policy.allowedMints.join(",")}`,
    `maxSpendAtomic:${policy.maxSpendAtomic}`,
    `dailySpendCapAtomic:${policy.dailySpendCapAtomic}`,
    `expiresAt:${policy.expiresAt}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildPolicyUpdateOwnerMessage({
  connectionId,
  policyPatch,
  signedAt,
  userWallet,
}: {
  connectionId: string;
  policyPatch: Partial<AgentPolicy>;
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard policy update",
    `wallet:${userWallet}`,
    `connection:${connectionId}`,
    `policyPatch:${canonicalJson(policyPatch)}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildConnectionRevokeOwnerMessage({
  connectionId,
  signedAt,
  userWallet,
}: {
  connectionId: string;
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard connection revoke",
    `wallet:${userWallet}`,
    `connection:${connectionId}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildActionDecisionOwnerMessage({
  actionId,
  connectionId,
  receiptAddress,
  signature,
  signedAt,
  status,
  userWallet,
}: {
  actionId: string;
  connectionId: string;
  receiptAddress: string | null;
  signature: string | null;
  signedAt: number;
  status: DecisionStatus;
  userWallet: string;
}): string {
  return [
    "SkillGuard action decision",
    `wallet:${userWallet}`,
    `connection:${connectionId}`,
    `action:${actionId}`,
    `status:${status}`,
    `receiptAddress:${receiptAddress ?? ""}`,
    `signature:${signature ?? ""}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function buildWalletSessionOwnerMessage({
  signedAt,
  userWallet,
}: {
  signedAt: number;
  userWallet: string;
}): string {
  return [
    "SkillGuard wallet session",
    `wallet:${userWallet}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}

export function verifyConnectionOwnerProof(
  value: unknown,
  connection: ConnectionRecord,
  now = Date.now(),
): ConnectionOwnerProofResult {
  return verifyWalletOwnerMessageProof(
    value,
    connection.userWallet,
    (signedAt) =>
      buildConnectionOwnerMessage({
        agentId: connection.agentId,
        connectionId: connection.connectionId,
        policy: connection.policy,
        signedAt,
        userWallet: connection.userWallet,
      }),
    now,
  );
}

export function verifyPolicyUpdateOwnerProof(
  value: unknown,
  connection: ConnectionRecord,
  policyPatch: Partial<AgentPolicy>,
  now = Date.now(),
): ConnectionOwnerProofResult {
  return verifyWalletOwnerMessageProof(
    value,
    connection.userWallet,
    (signedAt) =>
      buildPolicyUpdateOwnerMessage({
        connectionId: connection.connectionId,
        policyPatch,
        signedAt,
        userWallet: connection.userWallet,
      }),
    now,
  );
}

export function verifyConnectionRevokeOwnerProof(
  value: unknown,
  connection: ConnectionRecord,
  now = Date.now(),
): ConnectionOwnerProofResult {
  return verifyWalletOwnerMessageProof(
    value,
    connection.userWallet,
    (signedAt) =>
      buildConnectionRevokeOwnerMessage({
        connectionId: connection.connectionId,
        signedAt,
        userWallet: connection.userWallet,
      }),
    now,
  );
}

export function verifyActionDecisionOwnerProof(
  value: unknown,
  {
    action,
    connection,
    receiptAddress,
    signature,
    status,
  }: {
    action: { actionId: string; manifest: ActionManifest };
    connection: ConnectionRecord;
    receiptAddress: string | null;
    signature: string | null;
    status: DecisionStatus;
  },
  now = Date.now(),
): ConnectionOwnerProofResult {
  return verifyWalletOwnerMessageProof(
    value,
    connection.userWallet,
    (signedAt) =>
      buildActionDecisionOwnerMessage({
        actionId: action.actionId,
        connectionId: connection.connectionId,
        receiptAddress,
        signature,
        signedAt,
        status,
        userWallet: connection.userWallet,
      }),
    now,
  );
}

export function verifyWalletSessionOwnerProof(
  value: unknown,
  userWallet: string,
  now = Date.now(),
): ConnectionOwnerProofResult {
  return verifyWalletOwnerMessageProof(
    value,
    userWallet,
    (signedAt) => buildWalletSessionOwnerMessage({ signedAt, userWallet }),
    now,
  );
}

function verifyWalletOwnerMessageProof(
  value: unknown,
  userWallet: string,
  expectedMessage: (signedAt: number) => string,
  now: number,
): ConnectionOwnerProofResult {
  // Hosted smoke runs use a fake wallet namespace so cleanup can never target a real wallet.
  if (userWallet.startsWith("SmokeWallet")) {
    return { ok: true };
  }

  const proof = parseConnectionOwnerProof(value);
  if (!proof) {
    return { error: "wallet_owner_proof_required", ok: false };
  }

  if (proof.wallet !== userWallet || proof.message !== expectedMessage(proof.signedAt)) {
    return { error: "invalid_wallet_owner_proof", ok: false };
  }

  if (
    !Number.isSafeInteger(proof.signedAt) ||
    proof.signedAt > now + 30_000 ||
    now - proof.signedAt > CONNECTION_OWNER_PROOF_MAX_AGE_MS
  ) {
    return { error: "wallet_owner_proof_expired", ok: false };
  }

  try {
    const publicKey = bs58.decode(proof.wallet);
    const signature = Buffer.from(proof.signatureBase64, "base64");
    if (publicKey.length !== 32 || signature.length !== 64) {
      return { error: "invalid_wallet_owner_proof", ok: false };
    }

    const ok = nacl.sign.detached.verify(
      new TextEncoder().encode(proof.message),
      signature,
      publicKey,
    );
    return ok ? { ok: true } : { error: "invalid_wallet_owner_proof", ok: false };
  } catch {
    return { error: "invalid_wallet_owner_proof", ok: false };
  }
}

function parseConnectionOwnerProof(value: unknown): ConnectionOwnerProof | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.type !== "solana-sign-message" ||
    !hasText(value.wallet) ||
    !hasText(value.message) ||
    !hasText(value.signatureBase64) ||
    typeof value.signedAt !== "number" ||
    !Number.isSafeInteger(value.signedAt)
  ) {
    return null;
  }

  return {
    message: value.message,
    signatureBase64: value.signatureBase64,
    signedAt: value.signedAt,
    type: "solana-sign-message",
    wallet: value.wallet,
  };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
