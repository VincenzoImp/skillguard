import { type ReactNode, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  Database,
  ExternalLink,
  FileCheck2,
  Globe2,
  LockKeyhole,
  QrCode,
  Radio,
  Server,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import QRCode from "qrcode";
import { BrowserRouter, Link, NavLink, Route, Routes } from "react-router-dom";
import iconMark from "../../../assets/brand/icon.png";
import { liveApiBaseUrl, liveApiCurlExamples, liveApiEndpoints, liveSiteUrl } from "./liveApi";
import { researchAgentPairing, researchAgentPairingLink } from "./pairing";
import { firewallHero, siteRoutes } from "./siteNavigation";
import { roadmapItems, type RoadmapStatus } from "./submissionStatus";

type Decision = "pending" | "approved" | "rejected" | "revoked";

const repositoryUrl = "https://github.com/VincenzoImp/skillguard";
const programId = "HScpxWTMba1w73S4Qc7RZLm8nTj1SnRNBiANWbgaNNam";

const proofPoints = [
  ["Allow", "Safe zero-spend actions"],
  ["Ask", "Spending needs consent"],
  ["Block", "Overspend never reaches signing"],
  ["Revoke", "Cut agent access anytime"],
];

const problemCards = [
  {
    icon: WalletCards,
    title: "Agents need wallet power to be useful",
    text: "Research, trading, routing, payments, and reporting agents eventually need to act with real funds, not just suggest what a user should do.",
  },
  {
    icon: ShieldAlert,
    title: "Direct wallet access is too risky",
    text: "Giving an agent a signer, a funded wallet, or broad wallet permissions can turn one bad prompt, bug, or exploit into lost funds.",
  },
  {
    icon: LockKeyhole,
    title: "Manual approval kills autonomy",
    text: "If every small action needs a human signature, the agent stops being autonomous. Users need granular consent, not all-or-nothing control.",
  },
];

const solutionSteps = [
  {
    title: "Pair",
    text: "The wallet owner connects an agent by QR and imports its public identity.",
  },
  {
    title: "Configure",
    text: "The user sets protocol allowlists, spend caps, daily limits, network, expiry, and approval mode.",
  },
  {
    title: "Filter",
    text: "Each agent request is normalized into a manifest and classified as allow, ask, or block.",
  },
  {
    title: "Sign",
    text: "Sensitive actions reach the wallet only after the user approves from the mobile control center.",
  },
  {
    title: "Prove",
    text: "The decision is stored as a Solana devnet receipt tied to the manifest hash.",
  },
];

const demoSteps: Array<{
  label: string;
  title: string;
  text: string;
  tone: "danger" | "safe" | "violet";
}> = [
  {
    label: "Free scan",
    title: "Safe work can proceed automatically",
    text: "A read-only wallet risk scan has no spend and no raw transaction. In Allow under limits mode, SkillGuard can approve it without interrupting the user.",
    tone: "safe",
  },
  {
    label: "Paid report",
    title: "Spending still needs consent",
    text: "A paid research report asks for 0.001 SOL. SkillGuard routes it to the mobile app and the wallet signs only after explicit approval.",
    tone: "violet",
  },
  {
    label: "Blocked",
    title: "Dangerous requests never reach the wallet",
    text: "A 0.05 SOL upgrade exceeds the user's 0.01 SOL per-action limit and is blocked before any signature prompt appears.",
    tone: "danger",
  },
];

const architectureNodes = [
  "Research agent",
  "SkillGuard SDK",
  "SkillGuard API",
  "Policy engine",
  "Android app",
  "Mobile Wallet Adapter",
  "Anchor receipt program",
];

const permissionRows = [
  ["Mode", "Ask every time / auto low-risk zero-spend"],
  ["Spend cap", "0.01 SOL per action"],
  ["Daily cap", "0.05 SOL"],
  ["Network", "Solana devnet only"],
  ["Protocols", "Helius, Birdeye"],
  ["Expiry", "24 hours"],
];

const receiptEvents = [
  "Action proposed by Research Agent",
  "Policy evaluated against wallet limits",
  "User decision recorded",
  "Receipt ready for Solana devnet",
];

const colorTokens = [
  { name: "Mint", hex: "#00F0A8", role: "Approval and safe actions" },
  { name: "Blue", hex: "#58A6FF", role: "Network and route preview" },
  { name: "Violet", hex: "#7B3FF7", role: "Revoked state and Solana accent" },
  { name: "Warning", hex: "#F5B84B", role: "Needs review" },
  { name: "Danger", hex: "#FF5A68", role: "Blocked or rejected" },
];

const resourceLinks = [
  {
    title: "GitHub repo",
    text: "Source, issues, and final public submission.",
    href: repositoryUrl,
    status: "configured",
  },
  {
    title: "Docs",
    text: "Product, feasibility, architecture, demo, and operating protocol.",
    href: `${repositoryUrl}/tree/main/docs`,
    status: "ready",
  },
  {
    title: "Brand assets",
    text: "Single SkillGuard logo mark used across the site and mobile UI.",
    href: `${repositoryUrl}/tree/main/assets/brand`,
    status: "ready",
  },
  {
    title: "Demo video",
    text: "Final recording slot for the 3-minute judge walkthrough.",
    href: "/demo",
    status: "pending",
  },
];

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  const [decision, setDecision] = useState<Decision>("pending");
  const decisionCopy = getDecisionCopy(decision);
  const DecisionIcon = decisionCopy.icon;
  const phoneDemoProps = {
    decision,
    setDecision,
    decisionCopy,
    DecisionIcon,
  };

  return (
    <main className="min-h-screen overflow-hidden bg-bg-950 text-text-primary">
      <div className="grid-mask pointer-events-none fixed inset-0 opacity-45" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-20 px-4 py-6 sm:px-6 lg:px-8">
        <Header />
        <Routes>
          <Route path="/" element={<HomePage phoneDemoProps={phoneDemoProps} />} />
          <Route path="/demo" element={<DemoPage phoneDemoProps={phoneDemoProps} />} />
          <Route path="/how-it-works" element={<ArchitecturePage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </div>
    </main>
  );
}

type PhoneDemoProps = Parameters<typeof PhoneDemo>[0];

function HomePage({ phoneDemoProps }: { phoneDemoProps: PhoneDemoProps }) {
  return (
    <>
      <section className="relative min-h-[760px] overflow-hidden rounded-2xl border border-border-subtle bg-bg-900/70 px-4 py-8 sm:px-7 lg:min-h-[700px] lg:px-10">
        <div className="section-grid pointer-events-none absolute inset-0" />
        <div className="relative z-10 grid min-h-[680px] items-center gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.72fr)]">
          <HeroCopy />
          <PhoneDemo {...phoneDemoProps} />
        </div>
      </section>

      <ProofStrip />
      <ProblemSection />
      <SolutionSection />
    </>
  );
}

function DemoPage({ phoneDemoProps }: { phoneDemoProps: PhoneDemoProps }) {
  return (
    <>
      <section className="grid items-center gap-8 rounded-2xl border border-border-subtle bg-bg-900/70 p-5 sm:p-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,0.72fr)]">
        <SectionHeader
          kicker="3-minute demo"
          title="One agent, one wallet, three outcomes: allow, ask, block."
          text="The recording path shows the full wallet-firewall story: pair Research Agent, approve a paid report from mobile, block an overspend, then revoke the agent."
        />
        <PhoneDemo {...phoneDemoProps} />
      </section>
      <DemoSection />
    </>
  );
}

function ArchitecturePage() {
  return (
    <>
      <ArchitectureSection />
      <SecuritySection />
    </>
  );
}

function DevelopersPage() {
  return (
    <>
      <DeveloperSection />
      <LiveApiSection />
    </>
  );
}

function AboutPage() {
  return (
    <>
      <BrandSystemSection />
      <RoadmapSection />
      <ResourceSection />
    </>
  );
}

function Header() {
  return (
    <header className="sticky top-4 z-40 flex items-center justify-between gap-4 rounded-xl border border-border-subtle bg-bg-950/88 px-3 py-3 backdrop-blur-xl sm:px-4">
      <Link to="/" className="flex items-center gap-3">
        <img src={iconMark} alt="SkillGuard icon" className="h-10 w-10 rounded-lg" />
        <p className="text-sm font-semibold text-text-primary">SkillGuard</p>
      </Link>
      <nav className="hidden items-center gap-1 lg:flex">
        {siteRoutes.map((route) => (
          <NavLink
            key={route.path}
            to={route.path}
            end={route.path === "/"}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-mint/10 text-brand-mint"
                  : "text-text-secondary hover:bg-surface-800 hover:text-text-primary"
              }`
            }
          >
            {route.label}
          </NavLink>
        ))}
      </nav>
      <a
        href={repositoryUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-lg border border-brand-mint/30 bg-brand-mint/10 px-3 text-sm font-semibold text-brand-mint transition hover:bg-brand-mint/15"
      >
        <Code2 className="h-4 w-4" />
        <span className="hidden sm:inline">GitHub</span>
      </a>
    </header>
  );
}

function HeroCopy() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8 inline-flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-950/80 p-3">
        <img src={iconMark} alt="SkillGuard logo" className="h-12 w-12 rounded-lg" />
        <span className="font-display text-2xl font-bold text-text-primary">SkillGuard</span>
      </div>
      <StatusPill icon={ShieldCheck}>Wallet firewall for onchain AI agents</StatusPill>
      <h1 className="mt-5 font-display text-4xl font-bold leading-[1.03] text-text-primary sm:text-5xl lg:text-6xl">
        {firewallHero.title}
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
        {firewallHero.subhead}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <HeroButton to="/demo" icon={Smartphone}>
          {firewallHero.primaryCta}
        </HeroButton>
        <HeroButton to="/how-it-works" icon={ShieldCheck} muted>
          {firewallHero.secondaryCta}
        </HeroButton>
      </div>
      <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
        {proofPoints.map(([label, value]) => (
          <div key={label} className="rounded-lg border border-border-subtle bg-bg-950/64 p-3">
            <p className="text-xs text-text-muted">{label}</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProofStrip() {
  return (
    <section className="grid gap-3 md:grid-cols-3">
      <ProofCard
        icon={Radio}
        label="Core gap"
        value="Agents can act. Users need control."
        text="SkillGuard lets agents request wallet actions without receiving private keys or unrestricted spending authority."
      />
      <ProofCard
        icon={FileCheck2}
        label="Demo proof"
        value="Real Android + devnet receipt"
        text={`Mobile Wallet Adapter signs decisions and the Anchor receipt program is deployed at ${programId}.`}
      />
      <ProofCard
        icon={LockKeyhole}
        label="Safety model"
        value="Allow, ask, block, revoke"
        text="Safe zero-spend actions can pass under policy. Spending and sensitive actions need consent. Violations are blocked."
      />
    </section>
  );
}

function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-28">
      <SectionHeader
        kicker="Need"
        title="Onchain agents are useful only when they can act. That is also when they become risky."
        text="The hard part is not generating an action. It is giving an AI agent access to a wallet with real funds without turning that agent into a silent signer."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {problemCards.map((card) => (
          <FeatureCard key={card.title} icon={card.icon} title={card.title} text={card.text} />
        ))}
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="scroll-mt-28" id="solution">
      <SectionHeader
        kicker="Solution"
        title="SkillGuard is the permission layer between the agent and wallet signing."
        text="Agents can keep operating, but every request passes through wallet-owned policy. The result is simple: allow safe automation, ask for sensitive approval, block dangerous actions."
      />
      <div className="mt-8 grid gap-3 lg:grid-cols-5">
        {solutionSteps.map((step, index) => (
          <div key={step.title} className="relative rounded-xl border border-border-subtle bg-surface-900/68 p-5">
            <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-mint/12 text-sm font-bold text-brand-mint">
              {index + 1}
            </div>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-text-secondary">{step.text}</p>
            {index < solutionSteps.length - 1 ? (
              <ChevronRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-border-subtle bg-bg-950 p-1 text-brand-blue lg:block" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function DemoSection() {
  return (
    <section id="demo" className="scroll-mt-28">
      <SectionHeader
        kicker="Demo"
        title="The demo is built around the exact struggle: useful autonomy without uncontrolled wallet access."
        text="Research Agent is allowed to request work with the user's wallet, but SkillGuard decides whether the request is safe to auto-allow, sensitive enough to ask, or dangerous enough to block."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {demoSteps.map((step) => (
          <DemoCard key={step.title} {...step} />
        ))}
      </div>
      <div className="mt-5 rounded-xl border border-border-subtle bg-bg-900/80 p-5">
        <p className="text-sm font-semibold text-text-primary">Primary demo command</p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-border-subtle bg-bg-950 p-4 font-mono text-sm text-brand-mint">
          <code>{"scripts/live-demo.sh <connected-mobile-wallet-address>"}</code>
        </pre>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section id="architecture" className="scroll-mt-28">
      <SectionHeader
        kicker="How it works"
        title="SkillGuard filters signing access the way a firewall filters network access."
        text="The agent never receives the wallet key. It submits a signed request; SkillGuard checks the wallet-owned policy; mobile collects consent when needed; Solana records the decision."
      />
      <div className="mt-8 rounded-2xl border border-border-subtle bg-bg-900/76 p-5">
        <div className="grid gap-3 md:grid-cols-7">
          {architectureNodes.map((node, index) => (
            <div key={node} className="relative rounded-lg border border-border-subtle bg-surface-900 p-3">
              <p className="text-xs text-text-muted">Step {index + 1}</p>
              <p className="mt-2 text-sm font-semibold">{node}</p>
              {index < architectureNodes.length - 1 ? (
                <ChevronRight className="absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 rounded-full border border-border-subtle bg-bg-950 p-1 text-brand-blue md:block" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ArchitectureText
            title="What goes on-chain"
            items={[
              "User profile and agent connection",
              "Policy state and revocation status",
              "Action receipt with manifest hash and decision code",
              "Optional execution signature hash",
            ]}
          />
          <ArchitectureText
            title="What stays off-chain"
            items={[
              "Full human-readable ActionManifest",
              "Agent callback and pending-action state",
              "Demo fixtures and route summaries",
              "Private keys and wallet custody",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function DeveloperSection() {
  return (
    <section id="developers" className="scroll-mt-28">
      <SectionHeader
        kicker="Developers"
        title="Any agent can integrate by requesting permission instead of owning the signer."
        text="SkillGuard fits after Solana Skills, Agent Kit, wallet MCPs, or custom agent workers. The integration surface is deliberately small: submit a manifest, wait for allow/ask/block, receive a decision and receipt."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
          <h3 className="text-lg font-semibold">SDK snippet</h3>
          <pre className="mt-4 overflow-x-auto rounded-lg border border-border-subtle bg-bg-950 p-4 font-mono text-sm leading-6 text-text-secondary">
            <code>{`import { createSkillGuardClient } from "@skillguard/sdk";

const client = createSkillGuardClient({ apiUrl, agentId, agentSigner, connectionId });
const action = await client.submitAction(manifest);
const decision = await client.onDecision(action.actionId);`}</code>
          </pre>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <DeveloperTile title="Input" value="ActionManifest JSON" />
          <DeveloperTile title="Policy result" value="pass, requires_approval, or fail" />
          <DeveloperTile title="User channel" value="Android approval inbox" />
          <DeveloperTile title="Output" value="Decision and receipt hash" />
        </div>
      </div>
      <ResearchAgentPairingCard />
    </section>
  );
}

function ResearchAgentPairingCard() {
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;

    QRCode.toDataURL(researchAgentPairingLink, {
      color: {
        dark: "#030712",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
      margin: 1,
      width: 224,
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setQrDataUrl("");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mt-5 grid gap-5 rounded-xl border border-border-subtle bg-bg-900/76 p-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <div className="flex items-center justify-center rounded-xl border border-white/10 bg-white p-3">
        {qrDataUrl ? (
          <img src={qrDataUrl} alt="Research Agent pairing QR code" className="h-56 w-56" />
        ) : (
          <div className="flex h-56 w-56 items-center justify-center text-bg-950">
            <QrCode className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-3">
          <QrCode className="h-5 w-5 text-brand-mint" />
          <h3 className="text-lg font-semibold">Default mobile pairing</h3>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          Open the Android app, connect a wallet, go to Pair, and scan this QR. The
          app fills the trusted Research Agent identity, then the wallet owner
          reviews policy limits and signs the import.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <DeveloperTile title="Agent" value={researchAgentPairing.name} />
          <DeveloperTile title="Protocols" value={researchAgentPairing.protocols} />
        </div>
        <code className="mt-4 block break-all rounded-lg border border-border-subtle bg-bg-950/80 p-3 font-mono text-xs leading-5 text-brand-mint">
          {researchAgentPairingLink}
        </code>
      </div>
    </div>
  );
}

function LiveApiSection() {
  return (
    <section id="api" className="scroll-mt-28">
      <SectionHeader
        kicker="Live API"
        title="The public site is also the hosted permission API."
        text="The Android app, Research Agent, and demo scripts all target the same Vercel API. This is the connective layer that turns agent requests into wallet-owned decisions."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
          <div className="flex items-center gap-3">
            <Globe2 className="h-5 w-5 text-brand-mint" />
            <h3 className="text-lg font-semibold">Hosted surface</h3>
          </div>
          <div className="mt-5 divide-y divide-border-subtle border-y border-border-subtle">
            <LiveApiFact icon={Server} label="Site" value={liveSiteUrl} />
            <LiveApiFact icon={Database} label="API base" value={liveApiBaseUrl} />
            <LiveApiFact icon={ShieldCheck} label="Durable mode" value='Health returns storage: "upstash"' />
          </div>
          <div className="mt-5 border-t border-status-warning/30 pt-4">
            <p className="text-sm font-semibold text-status-warning">Storage gate</p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              Hosted demo flows need Vercel KV or Upstash Redis env vars. Without them, the API stays usable for
              single requests but health reports memory storage.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border-subtle bg-bg-900/76 p-5">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-brand-blue" />
            <h3 className="text-lg font-semibold">Agent integration commands</h3>
          </div>
          <div className="mt-4 grid gap-3">
            {liveApiCurlExamples.map((example) => (
              <div key={example.title} className="rounded-lg border border-border-subtle bg-bg-950/80 p-4">
                <p className="text-sm font-semibold text-text-primary">{example.title}</p>
                <pre className="mt-3 overflow-x-auto font-mono text-xs leading-5 text-brand-mint">
                  <code>{example.command}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-border-subtle bg-surface-900/70 p-5">
        <div className="flex items-center gap-3">
          <Code2 className="h-5 w-5 text-brand-mint" />
          <h3 className="text-lg font-semibold">Endpoints exposed for the demo</h3>
        </div>
        <div className="mt-4 grid gap-2">
          {liveApiEndpoints.map((endpoint) => (
            <div
              key={`${endpoint.method}-${endpoint.path}`}
              className="grid gap-3 rounded-lg border border-border-subtle bg-bg-950/62 p-3 sm:grid-cols-[92px_minmax(0,1fr)_minmax(220px,0.9fr)]"
            >
              <span className="inline-flex w-fit rounded-md border border-brand-blue/25 bg-brand-blue/10 px-2 py-1 font-mono text-xs font-semibold text-brand-blue">
                {endpoint.method}
              </span>
              <code className="break-all font-mono text-sm text-text-primary">{endpoint.path}</code>
              <p className="text-sm leading-6 text-text-secondary">{endpoint.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section className="scroll-mt-28">
      <SectionHeader
        kicker="Security boundary"
        title="SkillGuard is honest about what it protects."
        text="The MVP is a permission and audit layer for mediated requests. It does not cover signing paths outside SkillGuard."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <BoundaryCard
          title="Can claim"
          tone="safe"
          items={[
            "Policies are evaluated before SkillGuard-mediated requests reach approval.",
            "Auto-approval is limited to low-risk zero-spend manifest-only requests.",
            "Agents do not receive user private keys.",
            "Revocation blocks future SkillGuard requests from that agent.",
            "Receipts can link a decision to a manifest hash.",
          ]}
        />
        <BoundaryCard
          title="Must not claim"
          tone="danger"
          items={[
            "It cannot stop transactions signed outside SkillGuard.",
            "It cannot protect wallets if an agent already controls a key elsewhere.",
            "It does not guarantee every downstream protocol effect in the MVP.",
            "It is not a custody product.",
          ]}
        />
      </div>
    </section>
  );
}

function BrandSystemSection() {
  return (
    <section className="scroll-mt-28">
      <SectionHeader
        kicker="Design system"
        title="Wallet-grade, dark, compact, and status-driven."
        text="The site is the visual source of truth for mobile screens, README visuals, and demo framing."
      />
      <div className="mt-8 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
          <div className="flex min-h-64 items-center justify-center rounded-lg border border-border-subtle bg-bg-950 p-6">
            <img src={iconMark} alt="SkillGuard logo" className="h-36 w-36 rounded-2xl" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <DeveloperTile title="Voice" value="Calm, precise, protective" />
            <DeveloperTile title="Shape" value="8px cards, compact controls" />
            <DeveloperTile title="Primary state" value="Mint approval" />
            <DeveloperTile title="Critical state" value="Danger rejection" />
          </div>
        </div>
        <div className="grid gap-3">
          {colorTokens.map((token) => (
            <div
              key={token.name}
              className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-900/70 p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-9 w-9 rounded-md border border-white/10"
                  style={{ backgroundColor: token.hex }}
                />
                <div>
                  <p className="font-semibold">{token.name}</p>
                  <p className="font-mono text-xs text-text-muted">{token.hex}</p>
                </div>
              </div>
              <p className="max-w-[220px] text-right text-sm text-text-secondary">{token.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section className="scroll-mt-28">
      <SectionHeader
        kicker="Roadmap"
        title="The core proof is local; the remaining gates are account-owned."
        text="MWA signing, devnet receipts, release signing, the final upload key, password-manager backup, Vercel site/API, push registration, and the research-agent loop are in place. Final publication now depends on video recording and the submission form."
      />
      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {roadmapItems.map(({ step, title, status, note }) => (
          <div key={title} className="rounded-xl border border-border-subtle bg-surface-900/70 p-4">
            <p className="text-xs text-brand-blue">Step {step}</p>
            <p className="mt-2 text-sm font-semibold">{title}</p>
            <p className="mt-2 text-xs leading-5 text-text-secondary">{note}</p>
            <p
              className={`mt-3 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${roadmapStatusClass(status)}`}
            >
              {status}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function roadmapStatusClass(status: RoadmapStatus) {
  switch (status) {
    case "done":
      return "bg-brand-mint/10 text-brand-mint";
    case "ready":
      return "bg-brand-blue/10 text-brand-blue";
    case "external":
      return "bg-status-warning/10 text-status-warning";
  }
}

function ResourceSection() {
  return (
    <section className="pb-10">
      <SectionHeader
        kicker="Submission links"
        title="Everything points to one public project repo."
        text="These links are the final hackathon submission surface: repo, Vercel site/API, docs, brand assets, and the video slot."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {resourceLinks.map((link) => (
          <a
            key={link.title}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noreferrer" : undefined}
            className="group rounded-xl border border-border-subtle bg-surface-900/70 p-5 transition hover:border-brand-mint/40"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{link.title}</p>
              <ExternalLink className="h-4 w-4 text-text-muted transition group-hover:text-brand-mint" />
            </div>
            <p className="mt-3 text-sm leading-6 text-text-secondary">{link.text}</p>
            <p className="mt-4 inline-flex rounded-md border border-border-subtle px-2 py-1 text-xs text-text-muted">
              {link.status}
            </p>
          </a>
        ))}
      </div>
    </section>
  );
}

function PhoneDemo({
  decision,
  setDecision,
  decisionCopy,
  DecisionIcon,
}: {
  decision: Decision;
  setDecision: (decision: Decision) => void;
  decisionCopy: ReturnType<typeof getDecisionCopy>;
  DecisionIcon: typeof CircleDot;
}) {
  return (
    <div className="mx-auto w-full max-w-[430px]">
      <div className="rounded-[34px] border border-white/10 bg-black p-3 shadow-[0_34px_95px_rgba(0,0,0,0.5)]">
        <div className="overflow-hidden rounded-[26px] border border-border-subtle bg-bg-900">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 pb-4 pt-7">
            <div className="flex items-center gap-3">
              <img src={iconMark} alt="" className="h-9 w-9 rounded-lg" />
              <p className="text-sm font-semibold">SkillGuard</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${decisionCopy.border} ${decisionCopy.background} ${decisionCopy.tone}`}
            >
              <DecisionIcon className="h-3.5 w-3.5" />
              {decisionCopy.label}
            </span>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-border-subtle bg-bg-950/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Inbox
              </p>
              <div className="mt-3 rounded-lg border border-border-subtle bg-surface-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">Generate weekly wallet risk PDF</p>
                    <p className="mt-1 text-xs leading-5 text-text-secondary">
                      Research Agent wants to spend 0.001 SOL and record a SkillGuard receipt.
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${decisionCopy.border} ${decisionCopy.background} ${decisionCopy.tone}`}
                  >
                    {decisionCopy.label}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <PolicyMini label="Network" value="devnet" tone="text-brand-blue" />
                  <PolicyMini label="Spend" value="0.001 SOL" tone="text-text-primary" />
                  <PolicyMini label="Risk" value="medium" tone="text-status-warning" />
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-900 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Policy for this agent</p>
                <button
                  type="button"
                  className="rounded-md border border-brand-violet/30 px-2.5 py-1 text-xs font-semibold text-brand-violet transition hover:bg-brand-violet/10"
                  onClick={() => setDecision("revoked")}
                >
                  Revoke
                </button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-bg-950 p-1 text-center text-[11px] font-semibold">
                {["Ask", "Allow", "Block"].map((mode) => (
                  <span
                    key={mode}
                    className={`rounded-md px-2 py-2 ${
                      mode === "Ask"
                        ? "bg-brand-mint text-bg-950"
                        : "text-text-secondary"
                    }`}
                  >
                    {mode}
                  </span>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {permissionRows.map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-medium text-text-primary">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-lg border p-4 ${decisionCopy.border} ${decisionCopy.background}`}>
              <p className="text-sm font-semibold">After approval</p>
              <p className="mt-1 text-xs leading-5 text-text-secondary">
                The wallet signs one devnet transaction only after approval. The Activity tab
                shows the receipt hash and Explorer link.
              </p>
              <div className="mt-3 space-y-2">
                {[
                  "Network allowed: solana-devnet",
                  "Spend under per-action cap",
                  "Wallet approval required for SOL movement",
                ].map((check) => (
                  <div key={check} className="flex gap-2 text-xs text-text-secondary">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-mint" />
                    <span>{check}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision("rejected")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-status-danger/40 text-sm font-semibold text-status-danger transition hover:bg-status-danger/10"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => setDecision("approved")}
                className="approval-gradient inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-bg-950 transition hover:brightness-110"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
            </div>

            <div className="rounded-lg border border-border-subtle bg-surface-900 p-4">
              <p className="text-sm font-semibold">Activity</p>
              <div className="mt-3 space-y-3">
                {receiptEvents.map((event, index) => (
                  <div key={event} className="flex gap-3 text-xs text-text-secondary">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-mint" />
                    <div>
                      <p>{event}</p>
                      <p className="mt-1 font-mono text-[11px] text-text-muted">sg_{index + 1}_9x8f...dev</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-5 border-t border-border-subtle bg-bg-950 px-2 py-2 text-[10px] font-semibold text-text-muted">
            {["Home", "Inbox", "Agents", "Pair", "Activity"].map((tab) => (
              <div
                key={tab}
                className={`relative rounded-lg py-2 text-center ${
                  tab === "Inbox" ? "bg-surface-800 text-brand-mint" : ""
                }`}
              >
                {tab}
                {tab === "Inbox" && decision === "pending" ? (
                  <span className="absolute right-3 top-2 h-1.5 w-1.5 rounded-full bg-brand-mint" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PolicyMini({
  label,
  tone,
  value,
}: {
  label: string;
  tone: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-950 p-2 text-center">
      <p className="text-[10px] text-text-muted">{label}</p>
      <p className={`mt-1 font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ kicker, title, text }: { kicker: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold text-brand-mint">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-text-secondary">{text}</p>
    </div>
  );
}

function ProofCard({
  icon: Icon,
  label,
  value,
  text,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
      <Icon className="h-5 w-5 text-brand-mint" />
      <p className="mt-4 text-xs text-text-muted">{label}</p>
      <p className="mt-2 break-words text-base font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-text-secondary">{text}</p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
      <Icon className="h-5 w-5 text-brand-blue" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
    </div>
  );
}

function DemoCard({
  label,
  title,
  text,
  tone,
}: {
  label: string;
  title: string;
  text: string;
  tone: "danger" | "safe" | "violet";
}) {
  const toneClass = {
    danger: "text-status-danger bg-status-danger/10 border-status-danger/30",
    safe: "text-brand-mint bg-brand-mint/10 border-brand-mint/30",
    violet: "text-brand-violet bg-brand-violet/10 border-brand-violet/30",
  }[tone];

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
      <p className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${toneClass}`}>{label}</p>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{text}</p>
    </div>
  );
}

function ArchitectureText({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-950/62 p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-text-secondary">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-mint" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeveloperTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-900/70 p-4">
      <p className="text-xs text-text-muted">{title}</p>
      <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function LiveApiFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="py-3">
      <div className="flex items-center gap-2 text-xs text-text-muted">
        <Icon className="h-4 w-4 text-brand-blue" />
        <span>{label}</span>
      </div>
      <p className="mt-2 break-words font-mono text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function BoundaryCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "safe" | "danger";
  items: string[];
}) {
  const iconClass = tone === "safe" ? "text-brand-mint" : "text-status-danger";
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-900/70 p-5">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-sm leading-6 text-text-secondary">
            <CheckCircle2 className={`mt-1 h-4 w-4 shrink-0 ${iconClass}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HeroButton({
  href,
  to,
  icon: Icon,
  children,
  muted = false,
}: {
  href?: string;
  to?: string;
  icon: LucideIcon;
  children: ReactNode;
  muted?: boolean;
}) {
  const className = muted
    ? "inline-flex h-11 items-center gap-2 rounded-lg border border-border-subtle bg-surface-900 px-4 text-sm font-semibold text-text-primary transition hover:border-brand-blue/40 hover:bg-surface-800"
    : "approval-gradient inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-bg-950 transition hover:brightness-110";
  const content = (
    <>
      <Icon className="h-4 w-4" />
      {children}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <a
      href={href}
      className={className}
    >
      {content}
    </a>
  );
}

function StatusPill({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/10 px-3 py-1.5 text-sm font-medium text-brand-mint">
      <Icon className="h-4 w-4" />
      {children}
    </div>
  );
}

function getDecisionCopy(decision: Decision) {
  return {
    pending: {
      label: "Needs approval",
      tone: "text-status-warning",
      border: "border-status-warning/40",
      background: "bg-status-warning/10",
      icon: CircleDot,
    },
    approved: {
      label: "Approved",
      tone: "text-brand-mint",
      border: "border-brand-mint/40",
      background: "bg-brand-mint/10",
      icon: CheckCircle2,
    },
    rejected: {
      label: "Rejected",
      tone: "text-status-danger",
      border: "border-status-danger/40",
      background: "bg-status-danger/10",
      icon: XCircle,
    },
    revoked: {
      label: "Agent revoked",
      tone: "text-brand-violet",
      border: "border-brand-violet/40",
      background: "bg-brand-violet/10",
      icon: LockKeyhole,
    },
  }[decision];
}

export default App;
