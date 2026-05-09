import type { AppTabId } from "./appNavigation";
import { getPendingActions, type MobileAction, type SkillGuardMobileState } from "./liveState";

export const LIVE_REFRESH_INTERVAL_MS = 4_000;

export function firstNewPendingAction(
  previous: SkillGuardMobileState,
  next: SkillGuardMobileState
): MobileAction | null {
  const previousPendingIds = new Set(
    getPendingActions(previous).map((action) => action.id)
  );
  return (
    getPendingActions(next).find((action) => !previousPendingIds.has(action.id)) ??
    null
  );
}

export function shouldOpenInboxForNewPending({
  activeTab,
  isBusy,
  isPairingScannerOpen,
}: {
  activeTab: AppTabId;
  isBusy: boolean;
  isPairingScannerOpen: boolean;
}): boolean {
  return !isBusy && !isPairingScannerOpen && activeTab !== "pairing";
}

export function liveRefreshStatus(action: MobileAction): string {
  return `New request from ${action.agentId}: ${action.title}`;
}
