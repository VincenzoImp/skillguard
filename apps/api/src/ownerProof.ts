import type { AgentPolicy } from "@skillguard/protocol";
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

export function verifyConnectionOwnerProof(
  value: unknown,
  connection: ConnectionRecord,
  now = Date.now(),
): ConnectionOwnerProofResult {
  // Hosted smoke runs use a fake wallet namespace so cleanup can never target a real wallet.
  if (connection.userWallet.startsWith("SmokeWallet")) {
    return { ok: true };
  }

  const proof = parseConnectionOwnerProof(value);
  if (!proof) {
    return { error: "wallet_owner_proof_required", ok: false };
  }

  if (
    proof.wallet !== connection.userWallet ||
    proof.message !==
      buildConnectionOwnerMessage({
        agentId: connection.agentId,
        connectionId: connection.connectionId,
        policy: connection.policy,
        signedAt: proof.signedAt,
        userWallet: connection.userWallet,
      })
  ) {
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
