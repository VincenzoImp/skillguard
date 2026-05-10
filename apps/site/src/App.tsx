import { type ReactNode, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Code2,
  Database,
  ExternalLink,
  Globe2,
  LockKeyhole,
  QrCode,
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
import { defaultPhoneDemoTab, phoneDemoTabs, type PhoneDemoTabId } from "./phoneDemoModel";
import { firewallHero, siteRoutes } from "./siteNavigation";
import { roadmapItems, type RoadmapStatus } from "./submissionStatus";

type Decision = "pending" | "approved" | "rejected" | "revoked";

const repositoryUrl = "https://github.com/VincenzoImp/skillguard";
const proofPoints = [
  ["Allow", "Low-risk automation"],
  ["Ask", "Spending approval"],
  ["Block", "Out-of-policy requests"],
  ["Revoke", "Agent access instantly"],
];

const problemCards = [
  {
    icon: WalletCards,
    title: "Useful agents need wallet access",
    text: "The best onchain agents should pay, route, rebalance, claim, report, or execute. They cannot do that if every workflow ends as advice.",
  },
  {
    icon: ShieldAlert,
    title: "Private keys are the wrong interface",
    text: "Giving an agent a signer, a funded wallet, or broad wallet permission turns one bad prompt, bug, or compromised model into real loss.",
  },
  {
    icon: LockKeyhole,
    title: "All-or-nothing consent does not scale",
    text: "If every action needs a human signature, the agent is not autonomous. If nothing needs consent, the wallet owner is exposed. The missing layer is policy.",
  },
];

const solutionSteps = [
  {
    title: "Pair",
    text: "The wallet owner scans an agent QR and imports its public identity. No private key is shared.",
  },
  {
    title: "Configure",
    text: "Set per-agent rules: network, protocols, spend caps, daily limits, approval mode, and expiry.",
  },
  {
    title: "Filter",
    text: "Each request becomes a manifest: who is asking, what may move, where, and under which limits.",
  },
  {
    title: "Sign",
    text: "Low-risk actions can proceed; sensitive actions wait for mobile approval; blocked actions never reach a wallet prompt.",
  },
  {
    title: "Prove",
    text: "Decisions can be linked to a Solana devnet receipt and manifest hash for auditability.",
  },
];

const demoSteps: Array<{
  label: string;
  title: string;
  text: string;
  tone: "danger" | "safe" | "violet";
}> = [
  {
    label: "1. Pair",
    title: "Connect Research Agent by QR",
    text: "The owner scans the pairing QR, reviews the policy template, and signs one wallet-scoped permission grant.",
    tone: "safe",
  },
  {
    label: "2. Ask",
    title: "Approve a 0.001 SOL action",
    text: "The agent asks to run a paid wallet-risk report. SkillGuard routes it to mobile because SOL movement needs consent.",
    tone: "violet",
  },
  {
    label: "3. Block",
    title: "Block a 0.05 SOL overspend",
    text: "The next request exceeds the configured cap, so the policy engine denies it before a signature prompt appears.",
    tone: "danger",
  },
  {
    label: "4. Revoke",
    title: "Revoke the agent",
    text: "The owner cuts off that agent identity. Future requests from it are denied for this wallet.",
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

const receiptEvents = [
  "Action proposed by Research Agent",
  "Policy evaluated against wallet limits",
  "User decision recorded",
  "Receipt anchored on Solana devnet",
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
    text: "Source code, reproducible checks, and the public hackathon submission.",
    href: repositoryUrl,
    status: "source",
  },
  {
    title: "Docs",
    text: "Architecture, feasibility notes, operating protocol, and demo instructions.",
    href: `${repositoryUrl}/tree/main/docs`,
    status: "reference",
  },
  {
    title: "Brand assets",
    text: "Logo and visual system used by the site, app, README, and demo.",
    href: `${repositoryUrl}/tree/main/assets/brand`,
    status: "assets",
  },
  {
    title: "Demo video",
    text: "Narrated three-minute walkthrough showing pair, approve, block, and revoke.",
    href: "/demo",
    status: "script",
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
          <Route path="/demo" element={<DemoPage />} />
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

      <ProblemSection />
      <SolutionSection />
    </>
  );
}

function DemoPage() {
  return (
    <DemoSection />
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

function ProblemSection() {
  return (
    <section id="problem" className="scroll-mt-28">
      <SectionHeader
        kicker="Need"
        title="Onchain agents become valuable when they can act. That is exactly when they become risky."
        text="The hard part is not asking an agent what to do. It is letting that agent use a wallet with real funds while the wallet owner keeps policy, consent, and revocation."
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
        title="SkillGuard puts a wallet-owned policy layer between agent intent and wallet signatures."
        text="Agents can keep working, but every request passes through rules the owner controls. Safe work can continue automatically, sensitive work asks first, and dangerous work is blocked."
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
        kicker="Demo runbook"
        title="The demo shows the firewall making three decisions in three minutes."
        text="Connect Research Agent by QR, approve a 0.001 SOL action, watch a 0.05 SOL overspend get blocked, then revoke the agent and prove future access is cut off."
      />
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        text="The agent never receives the wallet key. It submits a signed manifest, SkillGuard evaluates wallet-owned policy, the app collects consent when needed, and Solana can record the decision."
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
              "Optional transaction signature reference",
            ]}
          />
          <ArchitectureText
            title="What stays off-chain"
            items={[
              "Full human-readable ActionManifest",
              "Agent callback and pending request state",
              "Route summaries and human-readable request context",
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
        title="Any agent can integrate by requesting a decision, not controlling a signer."
        text="SkillGuard fits behind Solana Skills, Agent Kit, wallet MCPs, or a custom worker. Submit an ActionManifest, wait for allow, ask, or block, then continue only with a wallet-owned decision."
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
          Open the Android app, connect a wallet, go to Pair, and scan this QR.
          SkillGuard imports only the Research Agent identity and policy template;
          the wallet owner still reviews the limits and signs the connection.
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
        title="The website also exposes the hosted agent gateway."
        text="The Android app, Research Agent, and demo scripts all use the same Vercel API. It receives agent manifests, applies wallet policy, and returns the decision path."
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
              Hosted demo flows use Vercel KV or Upstash Redis for durable state. If those env vars are missing, the
              API can still answer requests but health reports memory storage.
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
          <h3 className="text-lg font-semibold">Endpoints used by app and agents</h3>
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
        title="SkillGuard is explicit about its security boundary."
        text="It protects requests that flow through the SkillGuard gateway. It does not claim to secure unrelated signers, custodial wallets, or transactions made outside the app."
      />
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <BoundaryCard
          title="Can claim"
          tone="safe"
          items={[
            "Policies are evaluated before SkillGuard-mediated requests reach approval.",
            "Auto-approval is limited to requests that match owner-defined low-risk rules.",
            "Agents do not receive private keys.",
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
            "It does not guarantee every downstream protocol effect in the current demo build.",
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
        title="A high-trust interface for a high-risk action."
        text="The visual system is dark, compact, and status-driven so approval, denial, revocation, and network state stay legible on mobile and in the demo."
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
        kicker="Submission readiness"
        title="The product proof is in place; the final asset is the narrated demo."
        text="The app, hosted API, Research Agent loop, devnet receipt flow, release APK, signing pipeline, and documentation are ready for judges. The remaining human task is recording the three-minute walkthrough."
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
        title="One public package for judges and developers."
        text="The submission points to the same source, hosted site/API, technical docs, brand assets, and demo script so the project is easy to inspect and rerun."
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
  const [activeTab, setActiveTab] = useState<PhoneDemoTabId>(defaultPhoneDemoTab);

  return (
    <div className="mx-auto w-full max-w-[356px]">
      <div className="rounded-[40px] border border-white/10 bg-black p-2 shadow-[0_34px_95px_rgba(0,0,0,0.48)]">
        <div className="flex h-[690px] max-h-[calc(100vh-7rem)] min-h-[620px] flex-col overflow-hidden rounded-[32px] border border-border-subtle bg-bg-900">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 pb-3 pt-5">
            <div className="flex items-center gap-3">
              <img src={iconMark} alt="" className="h-8 w-8 rounded-lg" />
              <p className="text-base font-extrabold tracking-[0]">SkillGuard</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${decisionCopy.border} ${decisionCopy.background} ${decisionCopy.tone}`}
            >
              <DecisionIcon className="h-3.5 w-3.5" />
              {decisionCopy.label}
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {activeTab === "home" ? (
              <PhoneHomeScreen decision={decision} onOpenInbox={() => setActiveTab("inbox")} onOpenPair={() => setActiveTab("pair")} />
            ) : null}
            {activeTab === "inbox" ? (
              <PhoneInboxScreen
                DecisionIcon={DecisionIcon}
                decisionCopy={decisionCopy}
                onApprove={() => setDecision("approved")}
                onReject={() => setDecision("rejected")}
              />
            ) : null}
            {activeTab === "agents" ? (
              <PhoneAgentsScreen onRevoke={() => setDecision("revoked")} />
            ) : null}
            {activeTab === "pair" ? <PhonePairScreen /> : null}
            {activeTab === "activity" ? <PhoneActivityScreen decision={decision} /> : null}
          </div>

          <div className="grid grid-cols-5 gap-1 border-t border-border-subtle bg-bg-950 px-2 pb-2 pt-2 text-[10px] font-extrabold text-text-muted">
            {phoneDemoTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative min-h-12 rounded-lg px-1 text-center transition ${
                  tab.id === activeTab ? "bg-surface-800 text-text-primary" : "hover:bg-surface-900"
                }`}
              >
                {tab.label}
                {tab.id === "inbox" && activeTab !== "inbox" && decision === "pending" ? (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-mint" />
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneHomeScreen({
  decision,
  onOpenInbox,
  onOpenPair,
}: {
  decision: Decision;
  onOpenInbox: () => void;
  onOpenPair: () => void;
}) {
  const pendingCount = decision === "pending" ? "1" : "0";
  const blockedCount = decision === "revoked" || decision === "rejected" ? "1" : "0";

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-subtle bg-surface-900 p-4">
        <div className="flex gap-2">
          <PhoneBadge tone="info">devnet</PhoneBadge>
          <PhoneBadge tone="info">live api</PhoneBadge>
        </div>
        <p className="mt-4 text-2xl font-extrabold leading-tight">
          {decision === "pending" ? "1 agent request needs review." : "Your wallet is guarded."}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <PhoneMetric label="Pending" value={pendingCount} tone="warning" />
        <PhoneMetric label="Agents" value="1" tone="safe" />
        <PhoneMetric label="Blocked" value={blockedCount} tone="danger" />
        <PhoneMetric label="History" value={decision === "pending" ? "0" : "1"} tone="info" />
      </div>
      <PhonePanel label="Wallet">
        <p className="mt-1 text-xl font-extrabold">13hF...op4Q</p>
        <button
          type="button"
          className="mt-4 h-11 rounded-lg bg-brand-mint px-4 text-sm font-extrabold text-bg-950"
        >
          Refresh
        </button>
      </PhonePanel>
      <div className="grid grid-cols-2 gap-2">
        <PhoneQuickAction body="Open pending request" disabled={decision !== "pending"} label="Review" onClick={onOpenInbox} />
        <PhoneQuickAction body="Scan QR or paste fallback" label="Pair" onClick={onOpenPair} />
      </div>
    </div>
  );
}

function PhoneInboxScreen({
  DecisionIcon,
  decisionCopy,
  onApprove,
  onReject,
}: {
  DecisionIcon: typeof CircleDot;
  decisionCopy: ReturnType<typeof getDecisionCopy>;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase text-text-muted">Inbox</p>
        <p className="mt-1 text-xl font-extrabold">Agent requests</p>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base font-extrabold leading-5">Generate wallet risk report</p>
          <span
            className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${decisionCopy.border} ${decisionCopy.background} ${decisionCopy.tone}`}
          >
            {decisionCopy.label}
          </span>
        </div>
        <p className="mt-3 text-sm leading-5 text-text-secondary">
          Research Agent requests 0.001 SOL for a wallet-risk report. SkillGuard asks before any signature.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PhoneInfoCell label="Network" value="devnet" />
          <PhoneInfoCell label="Spend" value="0.001 SOL" />
          <PhoneInfoCell label="Risk" value="medium" />
        </div>
      </div>
      <div className={`rounded-lg border p-4 ${decisionCopy.border} ${decisionCopy.background}`}>
        <p className="flex items-center gap-2 text-sm font-extrabold">
          <DecisionIcon className="h-4 w-4" />
          Policy says ask
        </p>
        <div className="mt-3 space-y-2">
          {[
            "Network allowed: solana-devnet",
            "Spend under per-action cap",
            "SOL movement requires wallet approval",
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
          onClick={onReject}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-status-danger/40 text-sm font-extrabold text-status-danger transition hover:bg-status-danger/10"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          className="approval-gradient inline-flex h-11 items-center justify-center gap-2 rounded-lg text-sm font-extrabold text-bg-950 transition hover:brightness-110"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve
        </button>
      </div>
    </div>
  );
}

function PhoneAgentsScreen({ onRevoke }: { onRevoke: () => void }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border-subtle bg-surface-900 p-4">
        <p className="text-xs font-bold uppercase text-text-muted">Connected agents</p>
        <p className="mt-2 text-sm leading-5 text-text-secondary">
          Each card controls one agent only. Revoked agents are hidden and cannot submit new wallet requests.
        </p>
      </div>
      <div className="rounded-lg border border-border-subtle bg-bg-900 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-extrabold">Research Agent</p>
            <p className="mt-1 text-sm leading-5 text-text-secondary">
              Wallet risk checks through SkillGuard.
            </p>
          </div>
          <PhoneBadge tone="safe">Active</PhoneBadge>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <PhoneInfoCell label="Network" value="solana-devnet" />
          <PhoneInfoCell label="Last seen" value="now" />
        </div>
        <div className="mt-4 border-t border-border-subtle pt-4">
          <p className="text-sm font-extrabold">Policy for this agent</p>
          <p className="mt-1 text-xs leading-5 text-text-secondary">
            Auto-approval applies only to low-risk zero-spend requests.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border border-border-subtle bg-bg-950 p-1 text-center text-[10px] font-extrabold">
            {["Ask every time", "Allow under limits", "Block"].map((mode, index) => (
              <span
                key={mode}
                className={`rounded-md px-1 py-2 ${index === 0 ? "bg-brand-mint text-bg-950" : "text-text-secondary"}`}
              >
                {mode}
              </span>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <PhoneInfoCell label="Max spend" value="0.01 SOL" />
            <PhoneInfoCell label="Daily cap" value="0.05 SOL" />
            <PhoneInfoCell label="Protocols" value="Helius, Birdeye" />
            <PhoneInfoCell label="Expiry" value="24h" />
          </div>
        </div>
        <button
          type="button"
          onClick={onRevoke}
          className="mt-4 h-11 w-full rounded-lg border border-status-danger/40 text-sm font-extrabold text-status-danger transition hover:bg-status-danger/10"
        >
          Revoke agent
        </button>
      </div>
    </div>
  );
}

function PhonePairScreen() {
  return (
    <div className="space-y-4">
      <PhonePanel label="Pair agent">
        <p className="mt-1 text-sm leading-5 text-text-secondary">
          Scan a trusted agent QR. Importing creates a wallet-scoped permission, not a private-key handoff.
        </p>
      </PhonePanel>
      <div className="rounded-xl border border-brand-mint/25 bg-brand-mint/10 p-4">
        <p className="text-lg font-extrabold">Scan pairing QR</p>
        <div className="mt-4 flex h-40 items-center justify-center rounded-xl border border-brand-mint/35 bg-bg-950">
          <QrCode className="h-20 w-20 text-brand-mint" />
        </div>
        <p className="mt-3 text-xs font-bold text-text-muted">QR scanner ready.</p>
      </div>
      <div className="rounded-lg border border-border-subtle bg-surface-900 p-4">
        <p className="text-xs font-bold uppercase text-text-muted">Loaded agent</p>
        <p className="mt-2 text-base font-extrabold">Research Agent</p>
        <p className="mt-2 break-all font-mono text-xs text-text-muted">
          9hSR6S7...xrsUGWBu
        </p>
        <button
          type="button"
          className="mt-4 h-11 w-full rounded-lg bg-brand-mint px-4 text-sm font-extrabold text-bg-950"
        >
          Sign & import agent
        </button>
      </div>
    </div>
  );
}

function PhoneActivityScreen({ decision }: { decision: Decision }) {
  const hasHistory = decision !== "pending";
  const outcome =
    decision === "approved"
      ? "Wallet-approved execution. Receipt and signed transaction are visible on Solana Explorer."
      : decision === "rejected"
        ? "The wallet owner rejected this request before execution."
        : decision === "revoked"
          ? "Agent access was revoked. Future requests are denied."
          : "Decisions recorded by this wallet will appear here.";

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase text-text-muted">Receipts</p>
        <p className="mt-1 text-xl font-extrabold">Decision history</p>
      </div>
      {hasHistory ? (
        <div className="rounded-lg border border-border-subtle bg-surface-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-extrabold">Weekly wallet risk report</p>
            <PhoneBadge tone={decision === "approved" ? "safe" : "danger"}>
              {decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : "Blocked"}
            </PhoneBadge>
          </div>
          <p className="mt-3 font-mono text-xs text-text-muted">sg_1_9x8f...dev</p>
          <p className="mt-3 text-xs leading-5 text-text-secondary">{outcome}</p>
          {receiptEvents.slice(1).map((event) => (
            <div key={event} className="mt-3 flex gap-2 text-xs text-text-secondary">
              <span className="mt-1 h-2 w-2 rounded-full bg-brand-mint" />
              <span>{event}</span>
            </div>
          ))}
        </div>
      ) : (
        <PhonePanel label="No history yet">
          <p className="mt-1 text-sm leading-5 text-text-secondary">
            Pending requests do not count as history until the wallet approves, rejects, blocks, or revokes.
          </p>
        </PhonePanel>
      )}
    </div>
  );
}

function PhoneMetric({
  label,
  tone,
  value,
}: {
  label: string;
  tone: "danger" | "info" | "safe" | "warning";
  value: string;
}) {
  const toneClass = {
    danger: "border-status-danger/30 bg-status-danger/10",
    info: "border-brand-blue/25 bg-brand-blue/10",
    safe: "border-brand-mint/25 bg-brand-mint/10",
    warning: "border-status-warning/30 bg-status-warning/10",
  }[tone];

  return (
    <div className={`min-h-20 rounded-lg border p-3 ${toneClass}`}>
      <p className="text-2xl font-extrabold">{value}</p>
      <p className="mt-1 text-xs font-bold text-text-secondary">{label}</p>
    </div>
  );
}

function PhoneQuickAction({
  body,
  disabled,
  label,
  onClick,
}: {
  body: string;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-h-24 rounded-lg border border-border-subtle bg-surface-900 p-3 text-left transition hover:border-brand-mint/30 disabled:opacity-45"
    >
      <p className="text-base font-extrabold">{label}</p>
      <p className="mt-1 text-xs leading-5 text-text-secondary">{body}</p>
    </button>
  );
}

function PhonePanel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-900 p-4">
      <p className="text-xs font-bold uppercase text-text-muted">{label}</p>
      {children}
    </div>
  );
}

function PhoneInfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-950 p-2">
      <p className="text-[10px] font-bold text-text-muted">{label}</p>
      <p className="mt-1 break-words text-xs font-bold text-text-primary">{value}</p>
    </div>
  );
}

function PhoneBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "danger" | "info" | "safe";
}) {
  const toneClass = {
    danger: "border-status-danger/40 bg-status-danger/10 text-status-danger",
    info: "border-brand-blue/35 bg-brand-blue/10 text-brand-blue",
    safe: "border-brand-mint/35 bg-brand-mint/10 text-brand-mint",
  }[tone];

  return (
    <span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
      {children}
    </span>
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
