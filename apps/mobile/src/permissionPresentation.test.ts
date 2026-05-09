import { describe, expect, it } from "vitest";

import { buildPermissionCards } from "./permissionPresentation";
import type { ConnectedAgent } from "./liveState";

describe("permission presentation", () => {
  it("builds one permission card per active agent", () => {
    const cards = buildPermissionCards([
      agent("conn-research", "Research Agent", "active"),
      agent("conn-revoked", "Revoked Agent", "revoked"),
      agent("conn-payments", "Payments Agent", "active"),
    ]);

    expect(cards.map((card) => card.connectionId)).toEqual([
      "conn-research",
      "conn-payments",
    ]);
    expect(cards[0]).toMatchObject({
      agentName: "Research Agent",
      mode: "ask_every_time",
    });
    expect(cards[0].rules.map((rule) => rule.label)).toEqual([
      "Per-action cap",
      "Daily cap",
      "Network",
      "Protocols",
      "Allowed mints",
    ]);
  });
});

function agent(
  connectionId: string,
  name: string,
  status: ConnectedAgent["status"]
): ConnectedAgent {
  return {
    connectionId,
    description: `${name} description`,
    id: connectionId.replace("conn-", "agent-"),
    lastSeen: status === "active" ? "live API" : "revoked",
    name,
    policy: {
      allowedProtocols: ["helius", "birdeye"],
      mode: "ask_every_time",
      network: "Solana devnet",
      permissions: ["Request approvals", "Record approval receipts"],
      spendLimit: "0.01 SOL",
    },
    rawPolicy: {
      active: status === "active",
      agentId: connectionId.replace("conn-", "agent-"),
      allowedMints: ["SOL"],
      allowedNetworks: ["solana-devnet"],
      allowedProtocols: ["helius", "birdeye"],
      dailySpendCapAtomic: "50000000",
      expiresAt: 4_100_000_000,
      maxSpendAtomic: "10000000",
      mode: "ask_every_time",
      policyId: `policy-${connectionId}`,
      revoked: status === "revoked",
      userWallet: "Wallet111",
    },
    status,
  };
}
