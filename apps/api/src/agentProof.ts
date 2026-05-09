import type { ActionManifest } from "@skillguard/protocol";
import { buildAgentActionMessage } from "@skillguard/protocol";
import bs58 from "bs58";
import nacl from "tweetnacl";

import type { AgentRecord, ConnectionRecord } from "./store.js";

const AGENT_ACTION_PROOF_MAX_AGE_MS = 10 * 60 * 1000;

export type AgentActionProofResult =
  | { ok: true }
  | {
      error:
        | "agent_action_proof_expired"
        | "agent_action_proof_required"
        | "invalid_agent_action_proof";
      ok: false;
    };

export function verifyAgentActionProof(
  value: unknown,
  {
    agent,
    connection,
    manifest,
  }: {
    agent: AgentRecord;
    connection: ConnectionRecord;
    manifest: ActionManifest;
  },
  now = Date.now(),
): AgentActionProofResult {
  const proof = parseAgentActionProof(value);
  if (!proof) {
    return { error: "agent_action_proof_required", ok: false };
  }

  if (
    proof.agentId !== agent.agentId ||
    proof.agentId !== connection.agentId ||
    proof.agentId !== manifest.agentId ||
    proof.message !==
      buildAgentActionMessage({
        agentId: agent.agentId,
        connectionId: connection.connectionId,
        manifest,
        signedAt: proof.signedAt,
      })
  ) {
    return { error: "invalid_agent_action_proof", ok: false };
  }

  if (
    !Number.isSafeInteger(proof.signedAt) ||
    proof.signedAt > now + 30_000 ||
    now - proof.signedAt > AGENT_ACTION_PROOF_MAX_AGE_MS
  ) {
    return { error: "agent_action_proof_expired", ok: false };
  }

  try {
    const publicKey = bs58.decode(agent.publicKey);
    const signature = Buffer.from(proof.signatureBase64, "base64");
    if (publicKey.length !== 32 || signature.length !== 64) {
      return { error: "invalid_agent_action_proof", ok: false };
    }

    const ok = nacl.sign.detached.verify(
      new TextEncoder().encode(proof.message),
      signature,
      publicKey,
    );
    return ok ? { ok: true } : { error: "invalid_agent_action_proof", ok: false };
  } catch {
    return { error: "invalid_agent_action_proof", ok: false };
  }
}

function parseAgentActionProof(value: unknown): {
  agentId: string;
  message: string;
  signatureBase64: string;
  signedAt: number;
  type: "ed25519-action";
} | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.type !== "ed25519-action" ||
    !hasText(value.agentId) ||
    !hasText(value.message) ||
    !hasText(value.signatureBase64) ||
    typeof value.signedAt !== "number" ||
    !Number.isSafeInteger(value.signedAt)
  ) {
    return null;
  }

  return {
    agentId: value.agentId,
    message: value.message,
    signatureBase64: value.signatureBase64,
    signedAt: value.signedAt,
    type: "ed25519-action",
  };
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
