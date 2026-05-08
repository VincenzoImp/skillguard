import { hashActionManifest } from "./hash.js";
import type { ActionManifest, AgentPolicy, PolicyResult, RiskLevel } from "./types.js";

const riskScore: Record<RiskLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function highestRisk(levels: RiskLevel[]): RiskLevel {
  return levels.reduce<RiskLevel>(
    (highest, level) => (riskScore[level] > riskScore[highest] ? level : highest),
    "low",
  );
}

function manifestRiskLevel(manifest: ActionManifest): RiskLevel {
  return highestRisk(manifest.riskSignals.map((signal) => signal.level));
}

function totalSpendAtomic(manifest: ActionManifest): bigint {
  return manifest.spend.reduce((total, item) => total + BigInt(item.amountAtomic), 0n);
}

export function evaluatePolicy(
  manifest: ActionManifest,
  policy: AgentPolicy,
  now = Math.floor(Date.now() / 1000),
): PolicyResult {
  const manifestHash = hashActionManifest(manifest);
  const reasons: string[] = [];

  if (!policy.active) {
    reasons.push("policy_inactive");
  }

  if (policy.revoked) {
    reasons.push("policy_revoked");
  }

  if (manifest.expiresAt <= now) {
    reasons.push("manifest_expired");
  }

  if (!policy.allowedNetworks.includes(manifest.network)) {
    reasons.push(`network_not_allowed:${manifest.network}`);
  }

  for (const protocol of manifest.protocols) {
    if (!policy.allowedProtocols.includes(protocol)) {
      reasons.push(`protocol_not_allowed:${protocol}`);
    }
  }

  for (const spend of manifest.spend) {
    if (!policy.allowedMints.includes(spend.mint)) {
      reasons.push(`mint_not_allowed:${spend.mint}`);
    }
  }

  if (totalSpendAtomic(manifest) > BigInt(policy.maxSpendAtomic)) {
    reasons.push("spend_exceeds_max");
  }

  if (policy.mode === "block") {
    reasons.push("policy_mode_block");
  }

  if (reasons.length > 0) {
    return {
      status: "fail",
      reasons,
      riskLevel: "high",
      manifestHash,
    };
  }

  if (policy.mode === "ask_every_time") {
    return {
      status: "requires_approval",
      reasons: ["policy_requires_manual_approval"],
      riskLevel: highestRisk([manifestRiskLevel(manifest), "medium"]),
      manifestHash,
    };
  }

  if (manifest.rawTransactionRef !== null) {
    return {
      status: "requires_approval",
      reasons: ["raw_transaction_requires_approval"],
      riskLevel: highestRisk([manifestRiskLevel(manifest), "medium"]),
      manifestHash,
    };
  }

  return {
    status: "pass",
    reasons: [],
    riskLevel: manifestRiskLevel(manifest),
    manifestHash,
  };
}
