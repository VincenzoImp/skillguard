import { Buffer } from "buffer";
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import { sha256 } from "@noble/hashes/sha256";

export const SKILLGUARD_PROGRAM_ID = new PublicKey(
  "HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam"
);

export const DECISION_APPROVED = 1;
export const USER_PROFILE_ACCOUNT_SPACE = 8 + 32 + 1;
export const AGENT_CONNECTION_ACCOUNT_SPACE = 8 + 32 + 32 + 1 + 1 + 1;
export const ACTION_RECEIPT_ACCOUNT_SPACE =
  8 + 32 + 32 + 32 + 32 + 1 + 1 + 32 + 8 + 1;

export const CREATE_USER_PROFILE_DISCRIMINATOR = Object.freeze([
  9, 214, 142, 184, 153, 65, 50, 174,
]);
export const CONNECT_AGENT_DISCRIMINATOR = Object.freeze([
  216, 176, 178, 137, 1, 158, 66, 126,
]);
export const RECORD_DECISION_DISCRIMINATOR = Object.freeze([
  13, 153, 150, 233, 19, 198, 102, 140,
]);

export interface SkillGuardAccounts {
  actionReceipt: PublicKey;
  agentConnection: PublicKey;
  userProfile: PublicKey;
}

export interface BuildSkillGuardApprovalInstructionsInput {
  actionId: string;
  agentId: string;
  includeConnectAgent: boolean;
  includeCreateUserProfile: boolean;
  manifestHash: string;
  owner: PublicKey;
  policyResult: string;
}

export function skillGuardBytes32(namespace: string, value: string): Buffer {
  return Buffer.from(sha256(Buffer.from(`${namespace}:${value}`, "utf8")));
}

export function deriveSkillGuardAccounts(
  owner: PublicKey,
  agentIdHash: Buffer,
  actionIdHash: Buffer
): SkillGuardAccounts {
  const [userProfile] = PublicKey.findProgramAddressSync(
    [Buffer.from("user"), owner.toBuffer()],
    SKILLGUARD_PROGRAM_ID
  );
  const [agentConnection] = PublicKey.findProgramAddressSync(
    [Buffer.from("connection"), owner.toBuffer(), agentIdHash],
    SKILLGUARD_PROGRAM_ID
  );
  const [actionReceipt] = PublicKey.findProgramAddressSync(
    [Buffer.from("receipt"), owner.toBuffer(), agentIdHash, actionIdHash],
    SKILLGUARD_PROGRAM_ID
  );

  return { actionReceipt, agentConnection, userProfile };
}

export function buildSkillGuardApprovalInstructions({
  actionId,
  agentId,
  includeConnectAgent,
  includeCreateUserProfile,
  manifestHash,
  owner,
  policyResult,
}: BuildSkillGuardApprovalInstructionsInput): TransactionInstruction[] {
  const agentIdHash = skillGuardBytes32("agent", agentId);
  const actionIdHash = skillGuardBytes32("action", actionId);
  const manifestHashBytes = skillGuardBytes32("manifest", manifestHash);
  const policyResultHash = skillGuardBytes32("policy", policyResult);
  const accounts = deriveSkillGuardAccounts(owner, agentIdHash, actionIdHash);
  const instructions: TransactionInstruction[] = [];

  if (includeCreateUserProfile) {
    instructions.push(buildCreateUserProfileInstruction(owner, accounts));
  }
  if (includeConnectAgent) {
    instructions.push(buildConnectAgentInstruction(owner, accounts, agentIdHash));
  }

  instructions.push(
    buildRecordDecisionInstruction(
      owner,
      accounts,
      agentIdHash,
      actionIdHash,
      manifestHashBytes,
      policyResultHash
    )
  );

  return instructions;
}

function buildCreateUserProfileInstruction(
  owner: PublicKey,
  accounts: SkillGuardAccounts
): TransactionInstruction {
  return new TransactionInstruction({
    data: Buffer.from(CREATE_USER_PROFILE_DISCRIMINATOR),
    keys: [
      { isSigner: true, isWritable: true, pubkey: owner },
      { isSigner: false, isWritable: true, pubkey: accounts.userProfile },
      { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
    ],
    programId: SKILLGUARD_PROGRAM_ID,
  });
}

function buildConnectAgentInstruction(
  owner: PublicKey,
  accounts: SkillGuardAccounts,
  agentIdHash: Buffer
): TransactionInstruction {
  return new TransactionInstruction({
    data: Buffer.concat([
      Buffer.from(CONNECT_AGENT_DISCRIMINATOR),
      agentIdHash,
    ]),
    keys: [
      { isSigner: true, isWritable: true, pubkey: owner },
      { isSigner: false, isWritable: false, pubkey: accounts.userProfile },
      { isSigner: false, isWritable: true, pubkey: accounts.agentConnection },
      { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
    ],
    programId: SKILLGUARD_PROGRAM_ID,
  });
}

function buildRecordDecisionInstruction(
  owner: PublicKey,
  accounts: SkillGuardAccounts,
  agentIdHash: Buffer,
  actionIdHash: Buffer,
  manifestHash: Buffer,
  policyResultHash: Buffer
): TransactionInstruction {
  return new TransactionInstruction({
    data: Buffer.concat([
      Buffer.from(RECORD_DECISION_DISCRIMINATOR),
      agentIdHash,
      actionIdHash,
      manifestHash,
      Buffer.from([DECISION_APPROVED]),
      policyResultHash,
    ]),
    keys: [
      { isSigner: true, isWritable: true, pubkey: owner },
      { isSigner: false, isWritable: false, pubkey: accounts.agentConnection },
      { isSigner: false, isWritable: true, pubkey: accounts.actionReceipt },
      { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
    ],
    programId: SKILLGUARD_PROGRAM_ID,
  });
}
