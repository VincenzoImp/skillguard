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

- [ ] Create a standalone Vite React TypeScript app.
- [ ] Configure Tailwind CSS 4 through `@tailwindcss/vite`.
- [ ] Add scripts: `dev`, `build`, `preview`.

### Task 2: Brand And Vision Experience

**Files:**
- Modify: `apps/site/src/App.tsx`
- Modify: `apps/site/src/styles.css`

- [ ] Render the SkillGuard wordmark and shield icon from `../../assets/brand`.
- [ ] Add sections for Vision, Brand, System, and Demo UI.
- [ ] Use a dark mobile-wallet visual language with mint, violet, blue, warning, and danger states.
- [ ] Keep the product and mobile approval mock visible in the first viewport.

### Task 3: Interactive Demo Screen

**Files:**
- Modify: `apps/site/src/App.tsx`

- [ ] Add a mobile approval mock with agent card, permission policy, action request, policy checks, and receipt timeline.
- [ ] Use Motion for subtle entrance and state animations.
- [ ] Keep all copy aligned to the product boundary: permission layer, mobile approval, revocation, on-chain receipts.

### Task 4: Public Project Site

**Files:**
- Modify: `apps/site/src/App.tsx`
- Modify: `apps/site/src/styles.css`
- Modify: `apps/site/index.html`

- [ ] Add project-site sections:

```text
Problem
Solution
Architecture
Demo flow
Developer integration
Security boundary
Hackathon scope
```

- [ ] Keep `apps/site` as the canonical visual reference for `apps/mobile`.
- [ ] The site should be suitable for README screenshots, pitch walkthroughs, and deployment as the public project homepage.

### Task 5: Verification And Server

**Files:**
- No file changes required.

- [ ] Run `npm install` inside `apps/site`.
- [ ] Run `npm run build` to verify the app compiles.
- [ ] Start `npm run dev -- --host 0.0.0.0` and report the local URL.
