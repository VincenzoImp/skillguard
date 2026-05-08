export type AgentStatus = "active" | "revoked";
export type PolicyMode = "ask_every_time" | "allow_under_limits" | "block";
export type ActionStatus = "pending" | "blocked" | "approved" | "rejected";
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
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  lastSeen: string;
  policy: AgentPolicy;
}

export interface DemoAction {
  id: string;
  agentId: string;
  title: string;
  summary: string;
  status: ActionStatus;
  risk: RiskTone;
  network: string;
  requestedAt: string;
  manifestHash: string;
  spend: string;
  checks: PolicyCheck[];
  signature?: string;
  decisionReason?: string;
}

export interface SkillGuardMobileState {
  agent: ConnectedAgent;
  selectedActionId: string;
  actions: DemoAction[];
}

export const initialMobileState: SkillGuardMobileState = {
  agent: {
    id: "agent-research",
    name: "Research Agent",
    description: "Reads wallet risk signals and prepares Solana action reports.",
    status: "active",
    lastSeen: "live now",
    policy: {
      mode: "ask_every_time",
      network: "Solana devnet",
      spendLimit: "0 SOL",
      allowedProtocols: ["Helius", "Jupiter price", "Memo receipt"],
      permissions: ["Read wallet assets", "Request approvals", "Write receipt memo"],
    },
  },
  selectedActionId: "action-safe-risk-report",
  actions: [
    {
      id: "action-safe-risk-report",
      agentId: "agent-research",
      title: "Publish wallet-risk receipt",
      summary:
        "The agent wants to record a devnet receipt proving the wallet-risk check was approved.",
      status: "pending",
      risk: "warning",
      network: "Solana devnet",
      requestedAt: "18 sec ago",
      manifestHash: "2f4a9d3e5c6b7a18d91c",
      spend: "0 SOL",
      checks: [
        {
          label: "Network allowed",
          detail: "Solana devnet matches the current policy.",
          tone: "safe",
        },
        {
          label: "Spend inside limit",
          detail: "This action spends no SOL or USDC.",
          tone: "safe",
        },
        {
          label: "User approval required",
          detail: "Policy mode is ask every time.",
          tone: "warning",
        },
      ],
    },
    {
      id: "action-unsafe-overspend",
      agentId: "agent-research",
      title: "Swap 2.4 SOL through Jupiter",
      summary:
        "The agent requested a swap that exceeds the wallet policy and needs to be blocked.",
      status: "blocked",
      risk: "danger",
      network: "Solana devnet",
      requestedAt: "2 min ago",
      manifestHash: "9b0c7a4e1d55f83ab120",
      spend: "2.4 SOL",
      decisionReason: "Spend exceeds policy limit.",
      checks: [
        {
          label: "Protocol recognized",
          detail: "Jupiter is allowed for route previews.",
          tone: "safe",
        },
        {
          label: "Spend exceeds limit",
          detail: "Requested spend is 2.4 SOL; policy limit is 0 SOL.",
          tone: "danger",
        },
        {
          label: "Blocked before wallet prompt",
          detail: "SkillGuard does not ask the wallet to sign blocked actions.",
          tone: "danger",
        },
      ],
    },
  ],
};

export function getSelectedAction(state: SkillGuardMobileState): DemoAction {
  const action = state.actions.find((item) => item.id === state.selectedActionId);
  if (!action) {
    throw new Error(`Selected action ${state.selectedActionId} does not exist`);
  }
  return action;
}

export function getPendingActions(state: SkillGuardMobileState): DemoAction[] {
  return state.actions.filter((action) => action.status === "pending");
}

export function getBlockedActions(state: SkillGuardMobileState): DemoAction[] {
  return state.actions.filter((action) => action.status === "blocked");
}

export function approveAction(
  state: SkillGuardMobileState,
  actionId: string,
  signature: string
): SkillGuardMobileState {
  return updateAction(state, actionId, (action) => {
    if (action.status !== "pending") return action;
    return {
      ...action,
      decisionReason: "Approved by wallet owner.",
      signature,
      status: "approved",
    };
  });
}

export function rejectAction(
  state: SkillGuardMobileState,
  actionId: string
): SkillGuardMobileState {
  return updateAction(state, actionId, (action) => {
    if (action.status !== "pending") return action;
    return {
      ...action,
      decisionReason: "Rejected by wallet owner.",
      status: "rejected",
    };
  });
}

export function revokeAgent(state: SkillGuardMobileState): SkillGuardMobileState {
  return {
    ...state,
    agent: {
      ...state.agent,
      lastSeen: "revoked now",
      status: "revoked",
    },
    actions: state.actions.map((action) => {
      if (action.status !== "pending") return action;
      return {
        ...action,
        checks: [
          ...action.checks,
          {
            label: "Agent revoked",
            detail: "Future requests from this agent are blocked.",
            tone: "danger",
          },
        ],
        decisionReason: "Agent revoked by wallet owner.",
        risk: "danger",
        status: "blocked",
      };
    }),
  };
}

export function updatePolicyMode(
  state: SkillGuardMobileState,
  mode: PolicyMode
): SkillGuardMobileState {
  return {
    ...state,
    agent: {
      ...state.agent,
      policy: {
        ...state.agent.policy,
        mode,
      },
    },
    actions:
      mode === "block"
        ? state.actions.map((action) => {
            if (action.status !== "pending") return action;
            return {
              ...action,
              checks: [
                ...action.checks,
                {
                  label: "Policy set to block",
                  detail: "The wallet owner switched this agent to block mode.",
                  tone: "danger",
                },
              ],
              decisionReason: "Blocked by policy mode.",
              risk: "danger",
              status: "blocked",
            };
          })
        : state.actions,
  };
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

function updateAction(
  state: SkillGuardMobileState,
  actionId: string,
  updater: (action: DemoAction) => DemoAction
): SkillGuardMobileState {
  return {
    ...state,
    selectedActionId: actionId,
    actions: state.actions.map((action) =>
      action.id === actionId ? updater(action) : action
    ),
  };
}
