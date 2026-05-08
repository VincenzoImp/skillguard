# Operating Protocol

This project uses a strict implementation loop. The goal is to keep every step reviewable, tested, documented, and committed cleanly.

## Non-Negotiable Rules

1. Work in small steps.
2. Each step must have a clear purpose.
3. Every behavioral step must include tests or a written reason why automated tests are not applicable.
4. Documentation must be updated in the same step when behavior, architecture, commands, or scope changes.
5. No commit happens until verification passes.
6. No commit happens until the staged diff has been audited.
7. Critical and important audit findings are fixed before moving on.
8. After fixes, verification and audit run again.
9. Once a step is complete, continue directly to the next planned step.
10. Stop only for a real blocker, an irreversible decision, credentials, hardware access, or a product decision that needs the owner.

## Step Loop

For every task:

```text
1. Select next task from the MVP plan.
2. State the scope of the step.
3. Write or update tests first when possible.
4. Implement the smallest useful change.
5. Update docs and commands affected by the change.
6. Run local verification.
7. Stage only the intended files.
8. Run the pre-commit check.
9. Audit the staged diff.
10. Fix every critical/important finding.
11. Repeat verification and audit until clean.
12. Commit with a focused message.
13. Move to the next task.
```

## Verification Gate

The minimum verification before any commit is:

```bash
scripts/precommit-check.sh
```

This currently checks:

- staged whitespace errors
- forbidden generated output
- unresolved planning markers
- project site build

As the repo grows, this script must expand to include:

- protocol package tests
- API tests
- Anchor tests
- mobile typecheck/build checks
- demo-agent tests

## Diff Audit Gate

Before each commit, run:

```bash
scripts/audit-staged-diff.sh
```

The audit must answer:

- Are only intended files staged?
- Are generated files excluded?
- Are docs updated with behavior changes?
- Are tests updated for new logic?
- Is the change narrowly scoped?
- Are secrets, keys, private URLs, or credentials absent?
- Does the diff introduce vague claims, unsupported security promises, or hackathon-risky scope creep?

If any answer is negative, fix before committing.

## Commit Standard

Commit after each completed step. Use focused messages:

```text
docs: add operating protocol
feat(protocol): add action manifest hashing
test(protocol): cover policy rejection cases
feat(api): add pending action endpoints
feat(program): record decision receipt
feat(mobile): add wallet connect screen
```

Do not bundle unrelated changes into one commit.

## Audit Severity

Critical:

- failing verification
- security boundary misrepresented
- generated files or secrets staged
- broken build
- missing tests for behavior
- code path likely to fail in demo

Important:

- unclear API contract
- weak naming
- missing docs for commands or behavior
- duplicated logic likely to diverge
- UI inconsistent with `apps/site`

Minor:

- wording polish
- non-blocking visual improvements
- small refactor opportunities

Critical and important findings must be resolved immediately. Minor issues may be tracked if time is tight.

## Automation Rule

Continue automatically through the MVP plan after each successful commit. Pause only when:

- a command requires credentials or wallet funds
- Android device/emulator access is needed from the owner
- Solana deployment requires a funded keypair
- a technical spike fails and a fallback path must be chosen
- the product scope would materially change
