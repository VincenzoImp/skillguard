# SkillGuard MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hackathon-ready SkillGuard MVP that lets a demo Solana agent request wallet actions, evaluates them against user policy, lets the user approve/reject from a mobile-first UI, and records decision receipts on Solana devnet.

**Architecture:** Use a monorepo-style public repo with a shared TypeScript protocol package, an API server, a demo agent, a mobile app, and an Anchor program. The first implementation uses deterministic fixtures and devnet receipts; optional integrations come only after the vertical slice works.

**Tech Stack:** TypeScript, Node, React Native/Expo, Solana Mobile Wallet Adapter, `@solana/kit` or `@solana/web3.js` where required by mobile libraries, Anchor 0.32, Rust, SQLite or file-backed JSON for MVP metadata, Vitest for shared/API tests.

---

## Build Order

The implementation order is strict:

1. Environment and repo hygiene.
2. Operating protocol and baseline commit.
3. Shared protocol package.
4. Policy engine tests.
5. API with seeded demo data.
6. Anchor receipt program.
7. Mobile signing spike.
8. Mobile approval UI.
9. Demo agent.
10. End-to-end demo script.
11. Public project site from `apps/site`.
12. Optional integrations only if time remains.

Reason: the product's core is not UI polish; it is the manifest -> policy -> approval -> receipt loop.

## Component Map

Create or expand these workspaces:

```text
packages/protocol
  Shared schemas, canonical hashing, policy evaluation, fixtures.

apps/api
  Local MVP API, seeded demo agent, pending action store, receipt transaction prep.

programs/skillguard
  Anchor program for policies, revocation, and decision receipts.

apps/mobile
  Android app or Expo React Native app with Mobile Wallet Adapter integration.

apps/demo-agent
  CLI or small web worker that submits safe/unsafe ActionManifest fixtures.

apps/site
  Canonical visual prototype and future public project site. Use it as the
  binding style reference for mobile UI, demo screenshots, README visuals,
  and pitch presentation.
```

## Milestone 0: Environment And Repo Hygiene

Goal: remove setup uncertainty before building product logic.

### Task 0.0: Enforce Operating Protocol

**Files:**
- Create: `docs/OPERATING_PROTOCOL.md`
- Create: `scripts/precommit-check.sh`
- Create: `scripts/audit-staged-diff.sh`
- Create: `.githooks/pre-commit`
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-05-08-skillguard-mvp.md`

- [ ] Document the required loop:

```text
test -> implement -> document -> verify -> stage -> pre-commit -> audit -> fix -> re-verify -> commit -> next step
```

- [ ] Configure git hooks:

```bash
chmod +x scripts/precommit-check.sh scripts/audit-staged-diff.sh .githooks/pre-commit
git config core.hooksPath .githooks
```

- [ ] Verify before baseline commit:

```bash
npm --prefix apps/site run build
git add .
scripts/precommit-check.sh
scripts/audit-staged-diff.sh
git diff --cached --stat
```

- [ ] Commit:

```bash
git commit -m "chore: establish SkillGuard planning baseline"
```

Expected:

- Baseline commit contains docs, project site, brand assets, hook scripts, and implementation plan.
- No generated files are staged.

### Task 0.1: Install Solana Toolchain

**Files:**
- Modify: `docs/CRITICAL_FEASIBILITY_STUDY.md` if results differ from this plan.

- [x] Run:

```bash
curl --proto '=https' --tlsv1.2 -sSfL https://solana-install.solana.workers.dev | bash
```

- [x] Restart shell or source the installer PATH instructions.

- [x] Verify:

```bash
rustc --version
cargo --version
solana --version
anchor --version
```

Expected:

- `solana` exists.
- `anchor` exists.

- [x] Configure devnet:

```bash
solana config set --url devnet
solana config get
```

Expected:

- RPC URL points to devnet.

### Task 0.2: Install Android Tooling

**Files:**
- Modify: `docs/CRITICAL_FEASIBILITY_STUDY.md` if results differ from this plan.

- [x] Install JDK and Android Studio or the Android command-line tools.
- [x] Verify:

```bash
java -version
adb version
```

Expected:

- Java runtime exists.
- Android Debug Bridge exists.

Observed:

- OpenJDK 17.0.19 is available.
- Android Debug Bridge 37.0.0 is available.
- Android SDK 36 packages and AVD `skillguard_api36` are available.
- Android Studio is not installed; continue with CLI/emulator tooling unless mobile debugging requires the GUI.

### Task 0.3: Clean Generated Files

**Files:**
- Modify: `.gitignore`

- [x] Ensure these patterns exist:

```gitignore
node_modules/
dist/
target/
.expo/
*.tsbuildinfo
apps/*/vite.config.js
apps/*/vite.config.d.ts
```

- [x] Run:

```bash
git status --short
```

Expected:

- No generated build outputs are tracked.

## Milestone 1: Shared Protocol Package

Goal: define the product's core abstraction before API/mobile/program integration.

### Task 1.1: Create Package Skeleton

**Files:**
- Create: `packages/protocol/package.json`
- Create: `packages/protocol/tsconfig.json`
- Create: `packages/protocol/src/index.ts`
- Create: `packages/protocol/src/types.ts`
- Create: `packages/protocol/src/fixtures.ts`
- Create: `packages/protocol/src/hash.ts`
- Create: `packages/protocol/src/policy.ts`
- Create: `packages/protocol/src/policy.test.ts`

- [x] Add dependencies:

```json
{
  "name": "@skillguard/protocol",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "build": "tsc -p tsconfig.json"
  },
  "dependencies": {
    "zod": "^4.1.13"
  },
  "devDependencies": {
    "typescript": "^6.0.3",
    "vitest": "^4.0.15"
  }
}
```

### Task 1.2: Define Action Manifest Types

**Files:**
- Modify: `packages/protocol/src/types.ts`

- [ ] Define:

```ts
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
```

### Task 1.3: Implement Canonical Hashing

**Files:**
- Modify: `packages/protocol/src/hash.ts`
- Modify: `packages/protocol/src/policy.test.ts`

- [x] Implement canonical JSON by sorting object keys recursively.
- [x] Hash canonical JSON with SHA-256.
- [x] Test:

```text
same manifest with reordered keys -> same hash
changed spend amount -> different hash
```

### Task 1.4: Implement Policy Engine

**Files:**
- Modify: `packages/protocol/src/policy.ts`
- Modify: `packages/protocol/src/fixtures.ts`
- Modify: `packages/protocol/src/policy.test.ts`

- [x] Add fixtures:

```text
safeRiskReportManifest
unsafeOverspendManifest
expiredManifest
revokedPolicy
askEveryTimePolicy
allowUnderLimitsPolicy
blockPolicy
```

- [x] Implement checks in this order:

```text
policy active
policy not revoked
manifest not expired
network allowed
all protocols allowed
all spend mints allowed
total spend <= max spend
mode is not block
unknown raw transaction requires approval
```

- [x] Test at minimum:

```text
safe manifest with ask mode -> requires_approval
safe manifest with allow_under_limits -> pass
unsafe overspend -> fail
expired -> fail
revoked -> fail
unsupported protocol -> fail
block mode -> fail
unknown raw transaction ref -> requires_approval
```

Exit criteria:

```bash
cd packages/protocol
npm install
npm test
npm run build
```

All pass.

## Milestone 2: API MVP

Goal: give agents and mobile app a real integration surface.

### Task 2.1: API Skeleton

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/store.ts`
- Create: `apps/api/src/routes.ts`
- Create: `apps/api/src/seed.ts`
- Create: `apps/api/src/server.test.ts`

- [x] Use Hono for a small MVP API.
- [x] Add scripts:

```json
{
  "dev": "tsx watch src/server.ts",
  "test": "vitest run",
  "build": "tsc -p tsconfig.json"
}
```

### Task 2.2: Seed Demo State

**Files:**
- Modify: `apps/api/src/seed.ts`
- Modify: `apps/api/src/store.ts`

- [x] Seed:

```text
Research Agent
Demo user wallet placeholder
Ask-every-time policy
Unsafe overspend action
Safe receipt-only action
```

- [x] Store in memory first. Add SQLite only if needed.

### Task 2.3: Implement Endpoints

**Files:**
- Modify: `apps/api/src/routes.ts`
- Modify: `apps/api/src/server.test.ts`

- [x] Implement:

```text
GET /health
GET /agents
GET /agents/:agentId
POST /connections
PATCH /connections/:connectionId/policy
POST /connections/:connectionId/revoke
POST /actions
GET /actions/pending?wallet=...
GET /actions/:actionId
POST /actions/:actionId/evaluate
POST /actions/:actionId/decision
```

- [x] Tests:

```text
health returns ok
seeded agent appears
unsafe action evaluates fail
safe action evaluates requires_approval
revoke blocks future action
decision endpoint stores approved/rejected status
```

Exit criteria:

```bash
cd apps/api
npm install
npm test
npm run build
npm run dev
curl http://localhost:8787/health
```

## Milestone 3: Solana Program

Goal: record the minimum meaningful on-chain facts.

### Task 3.1: Anchor Project

**Files:**
- Create/replace under: `programs/skillguard`

- [x] Initialize:

```bash
cd programs
anchor init skillguard --no-git --package-manager npm
```

- [x] Keep the generated Anchor structure:

```text
programs/skillguard/Anchor.toml
programs/skillguard/programs/skillguard/src/lib.rs
programs/skillguard/tests/skillguard.ts
```

Implementation note:

- The existing placeholder directory was replaced with the generated Anchor workspace.
- The generated test runner requires the repo `scripts/dev-env.sh` Node 22 path on this machine; Node 25 fails in the generated Anchor/yargs dependency path.

### Task 3.2: Define Accounts

**Files:**
- Modify: `programs/skillguard/programs/skillguard/src/lib.rs`

- [x] Add accounts:

```text
UserProfile
AgentConnection
AgentPolicy
ActionReceipt
```

Fields:

```text
UserProfile:
  owner: Pubkey
  bump: u8

AgentConnection:
  owner: Pubkey
  agent_id_hash: [u8; 32]
  active: bool
  revoked: bool
  bump: u8

AgentPolicy:
  owner: Pubkey
  agent_id_hash: [u8; 32]
  max_spend_atomic: u64
  allowed_network_hash: [u8; 32]
  allowed_protocols_hash: [u8; 32]
  expires_at: i64
  active: bool
  bump: u8

ActionReceipt:
  owner: Pubkey
  agent_id_hash: [u8; 32]
  action_id_hash: [u8; 32]
  manifest_hash: [u8; 32]
  decision: u8
  policy_result_hash: [u8; 32]
  execution_signature_hash: Option<[u8; 32]>
  created_at: i64
  bump: u8
```

### Task 3.3: Define Instructions

**Files:**
- Modify: `programs/skillguard/programs/skillguard/src/lib.rs`
- Modify: `programs/skillguard/tests/skillguard.ts`

- [x] Implement:

```text
create_user_profile
connect_agent
update_policy
revoke_agent
record_decision
attach_execution_signature
```

- [x] Program tests:

```text
creates user profile
connects agent
updates policy
updates existing policy
revokes agent
records approval receipt
records rejection receipt
rejects invalid decision code
rejects receipt for revoked agent
rejects unauthorized owner
rejects duplicate action receipt
attaches execution signature hash
```

Exit criteria:

```bash
cd programs/skillguard
anchor test
anchor build
```

Devnet exit criteria:

```bash
solana config set --url devnet
anchor deploy
```

Record program ID in `README.md`.

## Milestone 4: Mobile App

Goal: make the product real and understandable.

### Task 4.1: Mobile Skeleton

**Files:**
- Create/replace under: `apps/mobile`

- [x] Use Expo React Native unless native Kotlin is chosen after spike.
- [x] Install current mobile packages:

```bash
npx create-expo-app apps/mobile
cd apps/mobile
npm install @wallet-ui/react-native-web3js react-native-quick-crypto @solana/web3.js expo-dev-client
```

Implementation note:

- The scaffold uses Expo SDK 55, React Native 0.83, React 19, `@wallet-ui/react-native-web3js` 4.1, `@solana/web3.js` 1.98, and `expo-dev-client`.
- `react-native-quick-base64` is pinned at the top level to dedupe native module registration between wallet/crypto dependencies.
- `expo-doctor` and TypeScript checks are part of the root precommit gate.

### Task 4.2: Mobile Wallet Adapter Spike

**Files:**
- Create: `apps/mobile/src/wallet.ts`
- Create: `apps/mobile/src/screens/WalletConnectScreen.tsx`

- [x] Implement wallet connection code path for Android MWA.
- [x] Show address and devnet badge.
- [x] Implement devnet Memo signing probe.
- [ ] Manually verify wallet connection and signature on Android emulator or device with an MWA-compatible wallet installed.

Exit criteria:

```text
wallet address visible in app
signature visible in app
signature opens in explorer
```

### Task 4.3: Product Screens

**Files:**
- Create: `apps/mobile/src/screens/AgentsScreen.tsx`
- Create: `apps/mobile/src/screens/PermissionEditorScreen.tsx`
- Create: `apps/mobile/src/screens/InboxScreen.tsx`
- Create: `apps/mobile/src/screens/ActionDetailScreen.tsx`
- Create: `apps/mobile/src/screens/ReceiptScreen.tsx`
- Create: `apps/mobile/src/components/StatusBadge.tsx`
- Create: `apps/mobile/src/components/ActionCard.tsx`
- Create: `apps/mobile/src/components/PolicyCheckList.tsx`

- [x] Implement screens in this order:

```text
Wallet connect
Agents
Permission editor
Inbox
Action detail
Receipt
```

Implementation note:

- Product screens are wired to a local, tested mobile demo state until API integration lands.
- The mobile state covers pending, blocked, approved, rejected, policy-mode changes, and revocation.
- `npm test` is now part of the root precommit gate for mobile when test files exist.

Acceptance:

```text
unsafe request is visibly blocked/rejected
safe request can be approved
revoked agent is visibly revoked
receipt screen shows manifest hash and tx signature
visual style follows apps/site and docs/DESIGN_SYSTEM.md
```

## Milestone 5: Demo Agent

Goal: show that any agent can integrate without getting the user's private key.

### Task 5.1: CLI Agent

**Files:**
- Create: `apps/demo-agent/package.json`
- Create: `apps/demo-agent/src/index.ts`
- Create: `apps/demo-agent/src/actions.ts`
- Create: `apps/demo-agent/src/client.ts`

- [ ] Implement commands:

```bash
npm run submit:safe
npm run submit:unsafe
npm run submit:revoked
```

- [x] Each command posts an ActionManifest to the API.

Implementation note:

- `apps/demo-agent` creates deterministic safe, unsafe, and revoked-path manifests.
- The CLI posts each manifest to `POST /actions` and then calls `POST /actions/:id/evaluate`.
- The revoked path first calls `POST /connections/:connectionId/revoke`.
- Demo-agent build and tests are now part of the root precommit gate.

Exit criteria:

```text
safe action appears in inbox
unsafe action appears with policy failure
revoked action is blocked
```

### Task 5.2: SDK Snippet

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/src/index.ts`
- Modify: `README.md`

- [ ] Export:

```ts
createSkillGuardClient({ apiUrl, agentId, agentSecret })
client.submitAction(manifest)
client.onDecision(actionId)
```

- [ ] README snippet must fit under 15 lines.

## Milestone 6: End-To-End Demo

Goal: produce a reliable 3-minute judge demo.

### Task 6.1: Local Orchestration

**Files:**
- Create: `scripts/dev-demo.sh`
- Create: `.env.example`
- Modify: `README.md`

- [ ] Script starts:

```text
API server
mobile app instructions
demo agent commands
site public site
```

### Task 6.2: Final Demo Script

**Files:**
- Modify: `docs/DEMO.md`

- [ ] Demo script should include exact commands:

```bash
cd apps/api && npm run dev
cd apps/demo-agent && npm run submit:unsafe
cd apps/demo-agent && npm run submit:safe
```

- [ ] Include exact spoken lines:

```text
"This agent is asking to use my wallet."
"SkillGuard checks it against my policy before I sign anything."
"This one is blocked because it exceeds my limit."
"This one is safe, so I approve it from mobile."
"The decision is now recorded as a Solana devnet receipt."
"Now I revoke the agent, and future requests are blocked."
```

### Task 6.3: Submission Readiness

**Files:**
- Modify: `README.md`
- Modify: `docs/FEASIBILITY.md`
- Modify: `docs/ROADMAP.md`

- [ ] README must show:

```text
one-sentence pitch
problem
solution
architecture diagram
demo flow
how to run
security boundary
program ID
screenshots or site link
```

### Task 6.4: Convert Project Site Into Public Project Site

**Files:**
- Modify: `apps/site/src/App.tsx`
- Modify: `apps/site/src/styles.css`
- Modify: `apps/site/index.html`
- Modify: `README.md`

- [ ] Keep `apps/site` as the visual source of truth for product UI.
- [ ] Make the page work as a public project site, not only as a design board.
- [ ] Required sections:

```text
Hero with one-sentence pitch
Problem: agents can act, users need control
Solution: manifest -> policy -> mobile approval -> Solana receipt
Live demo story with safe and unsafe requests
Architecture diagram
Developer integration snippet
Security boundary
Roadmap and hackathon scope
Links to GitHub, docs, demo video, and brand assets
```

- [ ] Required visual constraints:

```text
Use current wordmark and icon assets
Preserve dark wallet-grade style
Reuse mint/violet/blue state language
Reuse mobile approval mock
Avoid generic crypto landing-page sections
Keep the product visible in the first viewport
```

- [ ] Verification:

```bash
cd apps/site
npm run build
npm run dev
```

Expected:

- Build passes.
- Site explains SkillGuard without needing a live presenter.
- Mobile mock still demonstrates approve, reject, and revoke states.

- [ ] Final verification:

```bash
cd packages/protocol && npm test && npm run build
cd apps/api && npm test && npm run build
cd programs/skillguard && anchor test
cd apps/site && npm run build
```

## Cut Lines

Cut these immediately if time gets tight:

1. Push notifications: use polling.
2. QR connect: use pasted connect ID.
3. SQLite: use in-memory store and fixtures.
4. LI.FI: show route preview mock only.
5. x402: keep as pitch extension.
6. Native Android: use Expo/RN if it reaches MWA faster.

Do not cut:

1. Policy engine tests.
2. Safe and unsafe actions.
3. Revocation.
4. On-chain receipt.
5. Clear security boundary.

## Definition Of Done

SkillGuard MVP is done when:

- A demo agent can submit safe and unsafe action manifests.
- The API evaluates both deterministically.
- The user can approve/reject in a mobile-first UI.
- At least one approval or rejection receipt is recorded on Solana localnet/devnet.
- The receipt links to the manifest hash.
- Revocation blocks future requests.
- The public project site in `apps/site` explains the product clearly.
- The mobile UI follows the site design system.
- The README explains what SkillGuard does and does not protect.
- The demo can be completed in under 3 minutes.
