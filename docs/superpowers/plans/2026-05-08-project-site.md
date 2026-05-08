# Project Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a SkillGuard project site that presents the product vision, brand system, UI components, and mobile approval flow.

**Architecture:** Create a standalone Vite React app under `apps/site`. The app is a static interactive project site that imports the existing brand assets, renders product-facing sections, and contains a mobile approval mock that acts as the visual source of truth for the MVP UI.

**Tech Stack:** Vite 8, React 19, TypeScript 6, Tailwind CSS 4, Motion 12, Lucide React.

---

### Task 1: App Shell

**Files:**
- Create: `apps/site/package.json`
- Create: `apps/site/index.html`
- Create: `apps/site/vite.config.ts`
- Create: `apps/site/tsconfig.json`
- Create: `apps/site/src/main.tsx`
- Create: `apps/site/src/styles.css`
- Create: `apps/site/src/App.tsx`

- [x] Create a standalone Vite React TypeScript app.
- [x] Configure Tailwind CSS 4 through `@tailwindcss/vite`.
- [x] Add scripts: `dev`, `build`, `preview`.

### Task 2: Brand And Vision Experience

**Files:**
- Modify: `apps/site/src/App.tsx`
- Modify: `apps/site/src/styles.css`

- [x] Render the SkillGuard wordmark and shield icon from `../../assets/brand`.
- [x] Add sections for Vision, Brand, System, and Demo UI.
- [x] Use a dark mobile-wallet visual language with mint, violet, blue, warning, and danger states.
- [x] Keep the product and mobile approval mock visible in the first viewport.

### Task 3: Interactive Demo Screen

**Files:**
- Modify: `apps/site/src/App.tsx`

- [x] Add a mobile approval mock with agent card, permission policy, action request, policy checks, and receipt timeline.
- [x] Keep first-viewport content visible without opacity-hidden entrance animations for screenshot and judge-demo reliability.
- [x] Keep all copy aligned to the product boundary: permission layer, mobile approval, revocation, on-chain receipts.

### Task 4: Public Project Site

**Files:**
- Modify: `apps/site/src/App.tsx`
- Modify: `apps/site/src/styles.css`
- Modify: `apps/site/index.html`

- [x] Add project-site sections:

```text
Problem
Solution
Architecture
Demo flow
Developer integration
Security boundary
Hackathon scope
```

- [x] Keep `apps/site` as the canonical visual reference for `apps/mobile`.
- [x] The site should be suitable for README screenshots, pitch walkthroughs, and deployment as the public project homepage.

### Task 5: Verification And Server

**Files:**
- No file changes required.

- [x] Run `npm install` inside `apps/site`.
- [x] Run `npm run build` to verify the app compiles.
- [x] Start `npm run dev` for browser verification.

Observed local URL for this verification:

```text
http://127.0.0.1:5174/
```
