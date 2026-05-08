export type SkillGuardNetwork = "solana-devnet" | "solana-mainnet";
export type ApprovalMode = "ask_every_time" | "allow_under_limits" | "block";
export type DecisionStatus = "approved" | "rejected" | "blocked" | "expired";
export type RiskLevel = "low" | "medium" | "high";

export interface SpendItem {
  mint: "SOL" | "USDC";
  amountAtomic: string;
  human: string;
  reason: string;
}

export interface RiskSignal {
  level: RiskLevel;
  code: string;
  message: string;
}

export interface ActionManifest {
  schemaVersion: "skillguard.action.v1";
  actionId: string;
  agentId: string;
  userWallet: string;
  network: SkillGuardNetwork;
  kind: "wallet_risk_report" | "swap_preview" | "receipt_only";
  title: string;
  summary: string;
  protocols: string[];
  spend: SpendItem[];
  accountsTouched: string[];
  riskSignals: RiskSignal[];
  rawTransactionRef: string | null;
  createdAt: number;
  expiresAt: number;
}

export interface AgentPolicy {
  policyId: string;
  agentId: string;
  userWallet: string;
  mode: ApprovalMode;
  active: boolean;
  revoked: boolean;
  allowedNetworks: SkillGuardNetwork[];
  allowedProtocols: string[];
  allowedMints: Array<"SOL" | "USDC">;
  maxSpendAtomic: string;
  dailySpendCapAtomic: string;
  expiresAt: number;
}

export interface PolicyResult {
  status: "pass" | "requires_approval" | "fail";
  reasons: string[];
  riskLevel: RiskLevel;
  manifestHash: string;
}
