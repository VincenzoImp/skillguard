import { PublicKey, SystemProgram } from "@solana/web3.js";
import { describe, expect, test } from "vitest";
import {
  DECISION_APPROVED,
  RECORD_DECISION_DISCRIMINATOR,
  SKILLGUARD_PROGRAM_ID,
  buildSkillGuardApprovalInstructions,
  deriveSkillGuardAccounts,
  skillGuardBytes32,
} from "./skillguardProgram";

const owner = new PublicKey("Dd6tZmDnTaj9peCbFYdx91CzUEk9YGm1xYqct1UkTdTx");

describe("skillguard mobile program helpers", () => {
  test("derives the same PDAs as the Anchor program seeds", () => {
    const agentIdHash = skillGuardBytes32("agent", "agent-research");
    const actionIdHash = skillGuardBytes32("action", "action-safe-risk-report");

    const accounts = deriveSkillGuardAccounts(owner, agentIdHash, actionIdHash);

    expect(accounts.userProfile.toBase58()).toBe(
      "7DrEwjK8YhEDz1K46qtvFFrYzjkvJKVvyptsubS1jQr9"
    );
    expect(accounts.agentConnection.toBase58()).toBe(
      "BEhjLvVgmCUHC3aa7T3yaAhxQ15BWEL9pFCbDdkkDQfr"
    );
    expect(accounts.actionReceipt.toBase58()).toBe(
      "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z"
    );
  });

  test("builds bootstrap plus record_decision instructions for a fresh wallet", () => {
    const instructions = buildSkillGuardApprovalInstructions({
      actionId: "action-safe-risk-report",
      agentId: "agent-research",
      includeConnectAgent: true,
      includeCreateUserProfile: true,
      manifestHash: "2f4a9d3e5c6b7a18d91c",
      owner,
      policyResult: "safe:ask-every-time",
    });

    expect(instructions).toHaveLength(3);
    expect(instructions.every((instruction) => instruction.programId.equals(SKILLGUARD_PROGRAM_ID))).toBe(
      true
    );
    expect(instructions[0].keys.map((key) => key.pubkey.toBase58())).toEqual([
      owner.toBase58(),
      "7DrEwjK8YhEDz1K46qtvFFrYzjkvJKVvyptsubS1jQr9",
      SystemProgram.programId.toBase58(),
    ]);
    expect(instructions[1].keys.map((key) => key.pubkey.toBase58())).toEqual([
      owner.toBase58(),
      "7DrEwjK8YhEDz1K46qtvFFrYzjkvJKVvyptsubS1jQr9",
      "BEhjLvVgmCUHC3aa7T3yaAhxQ15BWEL9pFCbDdkkDQfr",
      SystemProgram.programId.toBase58(),
    ]);
  });

  test("serializes record_decision with Anchor discriminator and fixed-width args", () => {
    const [recordInstruction] = buildSkillGuardApprovalInstructions({
      actionId: "action-safe-risk-report",
      agentId: "agent-research",
      includeConnectAgent: false,
      includeCreateUserProfile: false,
      manifestHash: "2f4a9d3e5c6b7a18d91c",
      owner,
      policyResult: "safe:ask-every-time",
    });

    expect([...recordInstruction.data.subarray(0, 8)]).toEqual([
      ...RECORD_DECISION_DISCRIMINATOR,
    ]);
    expect(recordInstruction.data).toHaveLength(137);
    expect(recordInstruction.data[104]).toBe(DECISION_APPROVED);
    expect(recordInstruction.keys.map((key) => key.pubkey.toBase58())).toEqual([
      owner.toBase58(),
      "BEhjLvVgmCUHC3aa7T3yaAhxQ15BWEL9pFCbDdkkDQfr",
      "7SzfjQygT8TgXMEVMB8AKWKnoiXCaMv71WCWXUqrV82Z",
      SystemProgram.programId.toBase58(),
    ]);
  });
});
