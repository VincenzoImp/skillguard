import { describe, expect, it } from "vitest";
import {
  approveAction,
  getBlockedActions,
  getPendingActions,
  getSelectedAction,
  initialMobileState,
  rejectAction,
  revokeAgent,
  selectAction,
  updatePolicyMode,
} from "./demoState";

describe("mobile demo state", () => {
  it("starts with one pending safe action and one blocked unsafe action", () => {
    expect(getPendingActions(initialMobileState).map((action) => action.id)).toEqual([
      "action-safe-risk-report",
    ]);
    expect(getBlockedActions(initialMobileState).map((action) => action.id)).toEqual([
      "action-unsafe-overspend",
    ]);
  });

  it("approves a pending action and stores the receipt signature", () => {
    const nextState = approveAction(
      initialMobileState,
      "action-safe-risk-report",
      "5hRdemoSignature"
    );
    const selectedAction = getSelectedAction(nextState);

    expect(selectedAction.status).toBe("approved");
    expect(selectedAction.signature).toBe("5hRdemoSignature");
  });

  it("rejects a pending action without changing blocked actions", () => {
    const nextState = rejectAction(initialMobileState, "action-safe-risk-report");

    expect(getSelectedAction(nextState).status).toBe("rejected");
    expect(getBlockedActions(nextState).map((action) => action.id)).toEqual([
      "action-unsafe-overspend",
    ]);
  });

  it("revokes the agent and blocks remaining pending actions", () => {
    const nextState = revokeAgent(initialMobileState);

    expect(nextState.agent.status).toBe("revoked");
    expect(getPendingActions(nextState)).toEqual([]);
    expect(getSelectedAction(nextState).status).toBe("blocked");
  });

  it("updates the policy mode while preserving action history", () => {
    const nextState = updatePolicyMode(initialMobileState, "allow_under_limits");

    expect(nextState.agent.policy.mode).toBe("allow_under_limits");
    expect(nextState.actions).toHaveLength(initialMobileState.actions.length);
  });

  it("blocks pending actions when the policy mode changes to block", () => {
    const nextState = updatePolicyMode(initialMobileState, "block");

    expect(nextState.agent.policy.mode).toBe("block");
    expect(getPendingActions(nextState)).toEqual([]);
    expect(getSelectedAction(nextState).status).toBe("blocked");
  });

  it("selects an existing action for the detail screen", () => {
    const nextState = selectAction(initialMobileState, "action-unsafe-overspend");

    expect(getSelectedAction(nextState).id).toBe("action-unsafe-overspend");
  });
});
