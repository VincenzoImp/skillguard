# Submission Checklist

This file separates what is locally verified from what still requires an external account, final key choice, or recording.

## Local Proofs

- Repository remote: `https://github.com/VincenzoImp/skillguard.git`
- Devnet program: `HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam`
- Devnet Mobile Wallet Adapter receipt transaction: `5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF`
- Canonical installable APK: `build/mobile/skillguard.apk`
- Release signing pipeline: `SKILLGUARD_ANDROID_BUILD_PROFILE=release scripts/build-mobile-apk.sh`
- Final Android upload keystore: generated outside git under owner-controlled local secret storage.
- Public project site source: `apps/site`
- Public project site/API URL: `https://skillguard-sol.vercel.app/`
- Vercel deployment: connected Git integration from `main`
- Demo script: `docs/DEMO.md`

## Final Local Gate

Run this after the APK artifacts have been built:

```bash
. scripts/dev-env.sh
scripts/precommit-check.sh
scripts/submission-check.sh
```

The submission checker verifies the README proof strings, canonical APK artifact, APK signature, hosted API endpoint inside the APK bundle, origin remote, and clean working tree. It does not record the video or submit forms.

During development, use `SKILLGUARD_SUBMISSION_ALLOW_DIRTY=1 scripts/submission-check.sh` only to validate the checker before committing its own changes. The final run should use the default clean-tree mode.

## External Steps

These require an account, credential, or human review:

1. Record the under-3-minute demo using `docs/DEMO.md`.
2. Add the public site URL to the hackathon submission.
3. Add the unlisted demo video URL to this file, the README, and the public site after recording.
4. Solana Mobile dApp Store submission is explicitly out of scope for the hackathon package because publisher review/KYC timing is not controllable before deadline.

Completed owner-held secret step:

- The final Android upload keystore and signing env are backed up in the owner's password manager.

## Video Arc

1. Open with the site hero: SkillGuard is the firewall between AI agents and a Solana wallet.
2. Scan the `agent-research` pairing QR, sign the wallet-owner challenge, and show the default `0.01 SOL` policy.
3. Run `npm --prefix apps/research-agent run agent:loop`; show inbox delivery and, if the device receives it, the native push.
4. Switch the agent to `Allow under limits` and show the low-risk zero-spend scan auto-approval path.
5. Approve the `0.001 SOL` paid report and show one devnet transaction with SOL transfer plus SkillGuard receipt.
6. Show the `0.05 SOL` subscription upgrade blocked before wallet signing.
7. Revoke the agent and show future requests denied.
8. End with the SDK/API route: agents integrate without receiving user private keys.
