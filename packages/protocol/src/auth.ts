import { hashActionManifest } from "./hash.js";
import type { ActionManifest } from "./types.js";

export interface AgentActionProof {
  type: "ed25519-action";
  agentId: string;
  message: string;
  signatureBase64: string;
  signedAt: number;
}

export function buildAgentActionMessage({
  agentId,
  connectionId,
  manifest,
  signedAt,
}: {
  agentId: string;
  connectionId: string;
  manifest: ActionManifest;
  signedAt: number;
}): string {
  return [
    "SkillGuard agent action request",
    `agent:${agentId}`,
    `connection:${connectionId}`,
    `action:${manifest.actionId}`,
    `manifestHash:${hashActionManifest(manifest)}`,
    `signedAt:${signedAt}`,
  ].join("\n");
}
