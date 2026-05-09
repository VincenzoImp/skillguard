import type { ActionManifest, AgentPolicy, DecisionStatus, PolicyResult } from "@skillguard/protocol";

export interface AgentRecord {
  agentId: string;
  name: string;
  description: string;
}

export interface ConnectionRecord {
  connectionId: string;
  agentId: string;
  userWallet: string;
  policy: AgentPolicy;
}

export interface ActionRecord {
  actionId: string;
  connectionId: string;
  decisionReceiptAddress?: string | null;
  decisionSignature?: string | null;
  manifest: ActionManifest;
  policyResult: PolicyResult | null;
  decisionStatus: DecisionStatus | null;
}

export interface StoreSnapshot {
  agents: AgentRecord[];
  connections: ConnectionRecord[];
  actions: ActionRecord[];
}

export interface SmokeRunDeletionResult {
  actions: number;
  agents: number;
  connections: number;
}

export class SkillGuardStore {
  private readonly agents = new Map<string, AgentRecord>();
  private readonly connections = new Map<string, ConnectionRecord>();
  private readonly actions = new Map<string, ActionRecord>();

  constructor(snapshot: StoreSnapshot) {
    for (const agent of snapshot.agents) {
      this.agents.set(agent.agentId, agent);
    }

    for (const connection of snapshot.connections) {
      this.connections.set(connection.connectionId, connection);
    }

    for (const action of snapshot.actions) {
      this.actions.set(action.actionId, action);
    }
  }

  toSnapshot(): StoreSnapshot {
    return {
      actions: [...this.actions.values()],
      agents: [...this.agents.values()],
      connections: [...this.connections.values()],
    };
  }

  listAgents(): AgentRecord[] {
    return [...this.agents.values()];
  }

  createAgent(agent: AgentRecord): AgentRecord {
    this.agents.set(agent.agentId, agent);
    return agent;
  }

  getAgent(agentId: string): AgentRecord | undefined {
    return this.agents.get(agentId);
  }

  createConnection(connection: ConnectionRecord): ConnectionRecord {
    this.connections.set(connection.connectionId, connection);
    return connection;
  }

  getConnection(connectionId: string): ConnectionRecord | undefined {
    return this.connections.get(connectionId);
  }

  listConnections(wallet?: string): ConnectionRecord[] {
    const connections = [...this.connections.values()];
    if (!wallet) {
      return connections;
    }
    return connections.filter((connection) => connection.userWallet === wallet);
  }

  getConnectionForAction(action: ActionRecord): ConnectionRecord | undefined {
    return this.connections.get(action.connectionId);
  }

  updatePolicy(connectionId: string, policyPatch: Partial<AgentPolicy>): ConnectionRecord | undefined {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return undefined;
    }

    connection.policy = { ...connection.policy, ...policyPatch };
    return connection;
  }

  revokeConnection(connectionId: string): ConnectionRecord | undefined {
    return this.updatePolicy(connectionId, {
      revoked: true,
      active: false,
    });
  }

  createAction(action: ActionRecord): ActionRecord {
    this.actions.set(action.actionId, action);
    return action;
  }

  getAction(actionId: string): ActionRecord | undefined {
    return this.actions.get(actionId);
  }

  listActionsForWallet(wallet: string): ActionRecord[] {
    return [...this.actions.values()].filter((action) => action.manifest.userWallet === wallet);
  }

  listActionsForConnection(connectionId: string): ActionRecord[] {
    return [...this.actions.values()].filter((action) => action.connectionId === connectionId);
  }

  listPendingActions(wallet: string): ActionRecord[] {
    return [...this.actions.values()].filter(
      (action) => action.manifest.userWallet === wallet && action.decisionStatus === null,
    );
  }

  storeEvaluation(actionId: string, result: PolicyResult): ActionRecord | undefined {
    const action = this.actions.get(actionId);
    if (!action) {
      return undefined;
    }

    action.policyResult = result;
    return action;
  }

  storeDecision(
    actionId: string,
    status: DecisionStatus,
    metadata: { receiptAddress?: string | null; signature?: string | null } = {},
  ): ActionRecord | undefined {
    const action = this.actions.get(actionId);
    if (!action) {
      return undefined;
    }

    action.decisionStatus = status;
    if (metadata.signature !== undefined) {
      action.decisionSignature = metadata.signature;
    }
    if (metadata.receiptAddress !== undefined) {
      action.decisionReceiptAddress = metadata.receiptAddress;
    }
    return action;
  }

  deleteSmokeRunArtifacts(runId: string, wallet: string): SmokeRunDeletionResult {
    const deletedConnectionAgentIds = new Set<string>();
    let actions = 0;
    let connections = 0;

    for (const [actionId, action] of this.actions) {
      if (action.manifest.userWallet === wallet && actionId.includes(runId)) {
        this.actions.delete(actionId);
        actions += 1;
      }
    }

    for (const [connectionId, connection] of this.connections) {
      if (connection.userWallet === wallet) {
        deletedConnectionAgentIds.add(connection.agentId);
        this.connections.delete(connectionId);
        connections += 1;
      }
    }

    const referencedAgentIds = new Set(
      [...this.connections.values()].map((connection) => connection.agentId),
    );
    let agents = 0;
    for (const agentId of deletedConnectionAgentIds) {
      if (!referencedAgentIds.has(agentId) && this.agents.delete(agentId)) {
        agents += 1;
      }
    }

    return { actions, agents, connections };
  }
}
