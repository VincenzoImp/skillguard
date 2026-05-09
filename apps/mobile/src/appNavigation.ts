import { getBlockedActions, getPendingActions } from "./liveState";
import type { SkillGuardMobileState } from "./liveState";

export type AppTabId = "home" | "inbox" | "agents" | "pairing" | "activity";

export interface AppTabItem {
  badge: string | null;
  id: AppTabId;
  isPrimary: boolean;
  label: string;
}

export interface DashboardSummary {
  activeAgents: number;
  blockedActions: number;
  pendingActions: number;
  totalActions: number;
}

const tabLabels: Record<AppTabId, string> = {
  activity: "Activity",
  agents: "Agents",
  home: "Home",
  inbox: "Inbox",
  pairing: "Pair",
};

export function buildDashboardSummary(
  state: SkillGuardMobileState
): DashboardSummary {
  return {
    activeAgents: state.agents.filter((agent) => agent.status === "active").length,
    blockedActions: getBlockedActions(state).length,
    pendingActions: getPendingActions(state).length,
    totalActions: state.actions.length,
  };
}

export function buildTabItems(
  state: SkillGuardMobileState,
  isWalletConnected: boolean
): AppTabItem[] {
  const summary = buildDashboardSummary(state);
  const badges: Partial<Record<AppTabId, string>> = {
    activity: summary.totalActions > 0 ? String(summary.totalActions) : undefined,
    agents: state.agents.length > 0 ? String(state.agents.length) : undefined,
    inbox: summary.pendingActions > 0 ? String(summary.pendingActions) : undefined,
  };

  return (["home", "inbox", "agents", "pairing", "activity"] as AppTabId[]).map(
    (id) => ({
      badge: badges[id] ?? null,
      id,
      isPrimary: id === "home" && isWalletConnected,
      label: tabLabels[id],
    })
  );
}

export function recommendedInitialTab(
  state: SkillGuardMobileState,
  isWalletConnected: boolean
): AppTabId {
  if (!isWalletConnected) return "home";
  if (getPendingActions(state).length > 0) return "inbox";
  if (state.agents.length === 0) return "pairing";
  return "home";
}
