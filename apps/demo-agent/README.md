# SkillGuard Demo Agent

Sample agent used for the hackathon demo.

Capabilities:

- request wallet-risk report approval
- request unsafe overspend action for block demo
- request LI.FI route preview if enabled
- receive approval/rejection callbacks

## Commands

The demo agent must target the wallet currently connected in the mobile app:

```bash
export SKILLGUARD_API_URL=http://localhost:8787
export SKILLGUARD_USER_WALLET=<connected-mobile-wallet-address>
npm run submit:unsafe
npm run submit:safe
npm run submit:revoked
```

The CLI creates or updates the `Research Agent` connection for that wallet before
submitting each action. It never receives the user's private key.
