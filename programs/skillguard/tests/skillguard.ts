import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";
import { Skillguard } from "../target/types/skillguard";

describe("skillguard", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.skillguard as Program<Skillguard>;
  const systemProgram = anchor.web3.SystemProgram.programId;

  function fixedHash(seed: number): number[] {
    return Array.from({ length: 32 }, (_, index) => (seed + index) % 256);
  }

  function userProfilePda(
    owner: anchor.web3.PublicKey
  ): [anchor.web3.PublicKey, number] {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("user"), owner.toBuffer()],
      program.programId
    );
  }

  function agentConnectionPda(
    owner: anchor.web3.PublicKey,
    agentIdHash: number[]
  ): [anchor.web3.PublicKey, number] {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("connection"), owner.toBuffer(), Buffer.from(agentIdHash)],
      program.programId
    );
  }

  function agentPolicyPda(
    owner: anchor.web3.PublicKey,
    agentIdHash: number[]
  ): [anchor.web3.PublicKey, number] {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("policy"), owner.toBuffer(), Buffer.from(agentIdHash)],
      program.programId
    );
  }

  function actionReceiptPda(
    owner: anchor.web3.PublicKey,
    agentIdHash: number[],
    actionIdHash: number[]
  ): [anchor.web3.PublicKey, number] {
    return anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("receipt"),
        owner.toBuffer(),
        Buffer.from(agentIdHash),
        Buffer.from(actionIdHash),
      ],
      program.programId
    );
  }

  async function fundOwner(owner: anchor.web3.Keypair): Promise<void> {
    const signature = await provider.connection.requestAirdrop(
      owner.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction(
      { signature, ...latestBlockhash },
      "confirmed"
    );
  }

  async function createUserProfile(
    owner: anchor.web3.Keypair
  ): Promise<anchor.web3.PublicKey> {
    const [userProfile] = userProfilePda(owner.publicKey);

    await program.methods
      .createUserProfile()
      .accounts({
        owner: owner.publicKey,
        userProfile,
        systemProgram,
      })
      .signers([owner])
      .rpc();

    return userProfile;
  }

  async function connectAgent(
    owner: anchor.web3.Keypair,
    userProfile: anchor.web3.PublicKey,
    agentIdHash: number[]
  ): Promise<anchor.web3.PublicKey> {
    const [agentConnection] = agentConnectionPda(owner.publicKey, agentIdHash);

    await program.methods
      .connectAgent(agentIdHash)
      .accounts({
        owner: owner.publicKey,
        userProfile,
        agentConnection,
        systemProgram,
      })
      .signers([owner])
      .rpc();

    return agentConnection;
  }

  async function recordDecision(
    owner: anchor.web3.Keypair,
    agentConnection: anchor.web3.PublicKey,
    agentIdHash: number[],
    actionIdHash: number[],
    manifestHash: number[],
    decision: number,
    policyResultHash: number[]
  ): Promise<anchor.web3.PublicKey> {
    const [actionReceipt] = actionReceiptPda(
      owner.publicKey,
      agentIdHash,
      actionIdHash
    );

    await program.methods
      .recordDecision(
        agentIdHash,
        actionIdHash,
        manifestHash,
        decision,
        policyResultHash
      )
      .accounts({
        owner: owner.publicKey,
        agentConnection,
        actionReceipt,
        systemProgram,
      })
      .signers([owner])
      .rpc();

    return actionReceipt;
  }

  async function updatePolicy(
    owner: anchor.web3.Keypair,
    agentConnection: anchor.web3.PublicKey,
    agentIdHash: number[],
    agentPolicy: anchor.web3.PublicKey,
    maxSpendAtomic: anchor.BN,
    allowedNetworkHash: number[],
    allowedProtocolsHash: number[],
    expiresAt: anchor.BN
  ): Promise<void> {
    await program.methods
      .updatePolicy(
        agentIdHash,
        maxSpendAtomic,
        allowedNetworkHash,
        allowedProtocolsHash,
        expiresAt
      )
      .accounts({
        owner: owner.publicKey,
        agentConnection,
        agentPolicy,
        systemProgram,
      })
      .signers([owner])
      .rpc();
  }

  async function expectFailure(
    action: () => Promise<unknown>,
    expectedMessage?: string
  ): Promise<void> {
    try {
      await action();
    } catch (error) {
      if (expectedMessage) {
        expect(String((error as Error).message)).to.include(expectedMessage);
      }
      return;
    }

    throw new Error("Expected transaction to fail");
  }

  it("creates a user profile for the wallet owner", async () => {
    const owner = provider.wallet.publicKey;
    const [userProfile, bump] = userProfilePda(owner);

    await program.methods
      .createUserProfile()
      .accounts({
        owner,
        userProfile,
        systemProgram,
      })
      .rpc();

    const account = await program.account.userProfile.fetch(userProfile);
    expect(account.owner.toBase58()).to.equal(owner.toBase58());
    expect(account.bump).to.equal(bump);
  });

  it("connects an agent for an active owner profile", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(17);
    const [agentConnection, bump] = agentConnectionPda(
      owner.publicKey,
      agentIdHash
    );

    await connectAgent(owner, userProfile, agentIdHash);

    const account = await program.account.agentConnection.fetch(
      agentConnection
    );
    expect(account.owner.toBase58()).to.equal(owner.publicKey.toBase58());
    expect(Array.from(account.agentIdHash)).to.deep.equal(agentIdHash);
    expect(account.active).to.equal(true);
    expect(account.revoked).to.equal(false);
    expect(account.bump).to.equal(bump);
  });

  it("creates a policy for a connected agent", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(31);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);
    const [agentPolicy, bump] = agentPolicyPda(owner.publicKey, agentIdHash);
    const maxSpendAtomic = new anchor.BN(1_000_000);
    const allowedNetworkHash = fixedHash(73);
    const allowedProtocolsHash = fixedHash(109);
    const expiresAt = new anchor.BN(1_800_000_000);

    await updatePolicy(
      owner,
      agentConnection,
      agentIdHash,
      agentPolicy,
      maxSpendAtomic,
      allowedNetworkHash,
      allowedProtocolsHash,
      expiresAt
    );

    const account = await program.account.agentPolicy.fetch(agentPolicy);
    expect(account.owner.toBase58()).to.equal(owner.publicKey.toBase58());
    expect(Array.from(account.agentIdHash)).to.deep.equal(agentIdHash);
    expect(account.maxSpendAtomic.toString()).to.equal(
      maxSpendAtomic.toString()
    );
    expect(Array.from(account.allowedNetworkHash)).to.deep.equal(
      allowedNetworkHash
    );
    expect(Array.from(account.allowedProtocolsHash)).to.deep.equal(
      allowedProtocolsHash
    );
    expect(account.expiresAt.toString()).to.equal(expiresAt.toString());
    expect(account.active).to.equal(true);
    expect(account.bump).to.equal(bump);
  });

  it("updates an existing policy for a connected agent", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(131);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);
    const [agentPolicy] = agentPolicyPda(owner.publicKey, agentIdHash);

    await updatePolicy(
      owner,
      agentConnection,
      agentIdHash,
      agentPolicy,
      new anchor.BN(1_000_000),
      fixedHash(137),
      fixedHash(139),
      new anchor.BN(1_800_000_000)
    );

    const updatedMaxSpend = new anchor.BN(2_000_000);
    const updatedNetworkHash = fixedHash(149);
    const updatedProtocolsHash = fixedHash(157);
    const updatedExpiresAt = new anchor.BN(1_900_000_000);

    await updatePolicy(
      owner,
      agentConnection,
      agentIdHash,
      agentPolicy,
      updatedMaxSpend,
      updatedNetworkHash,
      updatedProtocolsHash,
      updatedExpiresAt
    );

    const account = await program.account.agentPolicy.fetch(agentPolicy);
    expect(account.maxSpendAtomic.toString()).to.equal(
      updatedMaxSpend.toString()
    );
    expect(Array.from(account.allowedNetworkHash)).to.deep.equal(
      updatedNetworkHash
    );
    expect(Array.from(account.allowedProtocolsHash)).to.deep.equal(
      updatedProtocolsHash
    );
    expect(account.expiresAt.toString()).to.equal(updatedExpiresAt.toString());
    expect(account.active).to.equal(true);
  });

  it("revokes a connected agent", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(151);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);

    await program.methods
      .revokeAgent(agentIdHash)
      .accounts({
        owner: owner.publicKey,
        agentConnection,
      })
      .signers([owner])
      .rpc();

    const account = await program.account.agentConnection.fetch(
      agentConnection
    );
    expect(account.active).to.equal(false);
    expect(account.revoked).to.equal(true);
  });

  it("records an approval decision receipt for an active agent", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(191);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);
    const actionIdHash = fixedHash(211);
    const manifestHash = fixedHash(223);
    const policyResultHash = fixedHash(227);
    const [actionReceipt, bump] = actionReceiptPda(
      owner.publicKey,
      agentIdHash,
      actionIdHash
    );

    await recordDecision(
      owner,
      agentConnection,
      agentIdHash,
      actionIdHash,
      manifestHash,
      1,
      policyResultHash
    );

    const account = await program.account.actionReceipt.fetch(actionReceipt);
    expect(account.owner.toBase58()).to.equal(owner.publicKey.toBase58());
    expect(Array.from(account.agentIdHash)).to.deep.equal(agentIdHash);
    expect(Array.from(account.actionIdHash)).to.deep.equal(actionIdHash);
    expect(Array.from(account.manifestHash)).to.deep.equal(manifestHash);
    expect(account.decision).to.equal(1);
    expect(Array.from(account.policyResultHash)).to.deep.equal(
      policyResultHash
    );
    expect(account.executionSignatureHash).to.equal(null);
    expect(account.createdAt.toNumber()).to.be.greaterThan(0);
    expect(account.bump).to.equal(bump);
  });

  it("attaches an execution signature hash to a decision receipt", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(229);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);
    const actionIdHash = fixedHash(233);
    const actionReceipt = await recordDecision(
      owner,
      agentConnection,
      agentIdHash,
      actionIdHash,
      fixedHash(239),
      1,
      fixedHash(241)
    );
    const executionSignatureHash = fixedHash(251);

    await program.methods
      .attachExecutionSignature(
        agentIdHash,
        actionIdHash,
        executionSignatureHash
      )
      .accounts({
        owner: owner.publicKey,
        actionReceipt,
      })
      .signers([owner])
      .rpc();

    const account = await program.account.actionReceipt.fetch(actionReceipt);
    expect(Array.from(account.executionSignatureHash)).to.deep.equal(
      executionSignatureHash
    );
  });

  it("records a rejection decision receipt for an active agent", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(253);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);
    const actionReceipt = await recordDecision(
      owner,
      agentConnection,
      agentIdHash,
      fixedHash(3),
      fixedHash(5),
      2,
      fixedHash(7)
    );

    const account = await program.account.actionReceipt.fetch(actionReceipt);
    expect(account.decision).to.equal(2);
    expect(account.executionSignatureHash).to.equal(null);
  });

  it("rejects invalid decision codes", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(9);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);

    await expectFailure(
      () =>
        recordDecision(
          owner,
          agentConnection,
          agentIdHash,
          fixedHash(15),
          fixedHash(21),
          9,
          fixedHash(27)
        ),
      "Invalid decision code."
    );
  });

  it("rejects decision receipts for revoked agents", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(11);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);

    await program.methods
      .revokeAgent(agentIdHash)
      .accounts({
        owner: owner.publicKey,
        agentConnection,
      })
      .signers([owner])
      .rpc();

    await expectFailure(
      () =>
        recordDecision(
          owner,
          agentConnection,
          agentIdHash,
          fixedHash(13),
          fixedHash(17),
          1,
          fixedHash(19)
        ),
      "Agent connection is not active."
    );
  });

  it("rejects unauthorized owners", async () => {
    const owner = anchor.web3.Keypair.generate();
    const attacker = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    await fundOwner(attacker);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(23);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);

    await expectFailure(
      () =>
        program.methods
          .revokeAgent(agentIdHash)
          .accounts({
            owner: attacker.publicKey,
            agentConnection,
          })
          .signers([attacker])
          .rpc(),
      "ConstraintSeeds"
    );
  });

  it("rejects duplicate action receipts", async () => {
    const owner = anchor.web3.Keypair.generate();
    await fundOwner(owner);
    const userProfile = await createUserProfile(owner);
    const agentIdHash = fixedHash(29);
    const agentConnection = await connectAgent(owner, userProfile, agentIdHash);
    const actionIdHash = fixedHash(31);
    const manifestHash = fixedHash(37);
    const policyResultHash = fixedHash(41);

    await recordDecision(
      owner,
      agentConnection,
      agentIdHash,
      actionIdHash,
      manifestHash,
      1,
      policyResultHash
    );

    await expectFailure(() =>
      recordDecision(
        owner,
        agentConnection,
        agentIdHash,
        actionIdHash,
        manifestHash,
        1,
        policyResultHash
      )
    );
  });
});
