import type { MobileAction } from "./liveState";

export interface InboxPresentation {
  pendingCount: number;
  queueActions: MobileAction[];
  selectedAction: MobileAction | null;
}

export function buildInboxPresentation(
  actions: MobileAction[],
  selectedActionId: string | null
): InboxPresentation {
  const pendingActions = actions.filter((action) => action.status === "pending");
  const selectedAction =
    pendingActions.find((action) => action.id === selectedActionId) ??
    pendingActions[0] ??
    null;

  return {
    pendingCount: pendingActions.length,
    queueActions: selectedAction
      ? pendingActions.filter((action) => action.id !== selectedAction.id)
      : pendingActions,
    selectedAction,
  };
}
