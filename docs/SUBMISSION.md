# Submission Checklist

This file separates what is locally verified from what still requires an external account, final key choice, or recording.

## Local Proofs

- Repository remote: `https://github.com/VincenzoImp/skillguard.git`
- Devnet program: `HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam`
- Devnet Mobile Wallet Adapter receipt transaction: `5FQoAasPEDvWuNcpDcHzJS3svM8Mz8v2Nnkjw2PSEYLNPAtjNeR1CCw6vzKumKPF8EydB5yv8nQKTwW4LsotRijF`
- Standalone local APK: `build/mobile/skillguard-standalone-debugsigned.apk`
- Release signed APK: `build/mobile/skillguard-release-signed.apk`
- Release signing pipeline: `SKILLGUARD_ANDROID_BUILD_PROFILE=release scripts/build-mobile-apk.sh`
- Final Android upload keystore: generated outside git under owner-controlled local secret storage.
- Public project site source: `apps/site`
- Public project site URL: `https://vincenzoimp.github.io/skillguard/`
- GitHub Pages workflow: `.github/workflows/deploy-site.yml`
- Demo script: `docs/DEMO.md`

## Final Local Gate

Run this after the APK artifacts have been built:

```bash
. scripts/dev-env.sh
scripts/precommit-check.sh
scripts/submission-check.sh
```

The submission checker verifies the README proof strings, local APK artifacts, release APK signature, origin remote, and clean working tree. It does not record the video, submit forms, or back up owner secrets.

During development, use `SKILLGUARD_SUBMISSION_ALLOW_DIRTY=1 scripts/submission-check.sh` only to validate the checker before committing its own changes. The final run should use the default clean-tree mode.

## External Steps

These require an account, credential, or human review:

1. Back up the final Android upload keystore and signing env in the owner's password manager.
2. Record the under-3-minute demo using `docs/DEMO.md`.
3. Add the public site URL to the hackathon submission.
4. Submit to the Solana Mobile dApp Store if the publisher portal is available in time.

## Video Arc

1. Open with the site hero: SkillGuard is a permission layer for Solana agents.
2. Show unsafe request: policy blocks spend before wallet prompt.
3. Show safe request: mobile approval records a devnet receipt.
4. Show revocation: future agent requests fail policy.
5. End with SDK snippet: agents integrate without receiving user private keys.
