import { type ReactNode, useState } from "react";
import { motion } from "motion/react";
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Radio,
  Route,
  ShieldCheck,
  Smartphone,
  WalletCards,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import iconMark from "../../../assets/brand/icon.png";
import wordmark from "../../../assets/brand/wordmark.png";

type Decision = "pending" | "approved" | "rejected" | "revoked";

const colorTokens = [
  { name: "Mint", hex: "#00F0A8", role: "Approval, safe actions" },
  { name: "Violet", hex: "#7B3FF7", role: "Solana identity, revoked state" },
  { name: "Blue", hex: "#58A6FF", role: "Network and route preview" },
  { name: "Warning", hex: "#F5B84B", role: "Needs review" },
  { name: "Danger", hex: "#FF5A68", role: "Blocked or rejected" },
];

const permissionRows = [
  ["Spend cap", "12 USDC per action"],
  ["Daily cap", "40 USDC"],
  ["Network", "Solana devnet only"],
  ["Protocols", "Jupiter, Helius"],
  ["Expiry", "24 hours"],
];

const systemCards = [
  {
    icon: KeyRound,
    title: "Permission Editor",
    text: "Users define what each agent can request before wallet actions happen.",
  },
  {
    icon: Bell,
    title: "Mobile Approval",
    text: "Sensitive requests become clear approve or reject decisions on mobile.",
  },
  {
    icon: Fingerprint,
    title: "Policy Receipts",
    text: "Every approval, rejection, and revocation can produce a verifiable receipt.",
  },
  {
    icon: LockKeyhole,
    title: "Revocation",
    text: "Agent access can be removed at any time from the control surface.",
  },
];

const receiptEvents = [
  "Action proposed by Research Agent",
  "Policy evaluated against wallet limits",
  "User decision recorded",
  "Receipt ready for Solana devnet",
];

function App() {
  const [decision, setDecision] = useState<Decision>("pending");

  const decisionCopy = {
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

  const DecisionIcon = decisionCopy.icon;

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-950 text-text-primary">
      <div className="grid-mask pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[860px] -translate-x-1/2 rounded-full bg-brand-mint/10 blur-[120px]" />
      <div className="pointer-events-none absolute right-[-180px] top-48 h-[520px] w-[520px] rounded-full bg-brand-violet/15 blur-[110px]" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-6 sm:px-6 lg:px-8">
        <Header />

        <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_440px]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-brand-mint/20 bg-brand-mint/10 px-3 py-1.5 text-sm font-medium text-brand-mint">
              <ShieldCheck className="h-4 w-4" />
              The permission layer for Solana agents
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-normal text-text-primary sm:text-6xl lg:text-7xl">
              Mobile-grade control for autonomous wallet actions.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-text-secondary sm:text-lg">
              SkillGuard connects agents to a user-controlled permission layer. Agents request actions, policies evaluate risk, the user approves from mobile, and the decision becomes auditable.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ActionButton icon={Smartphone}>Mobile approval</ActionButton>
              <ActionButton icon={WalletCards}>Wallet impact</ActionButton>
              <ActionButton icon={Route}>On-chain receipts</ActionButton>
            </div>
          </motion.div>

          <PhoneDemo
            decision={decision}
            setDecision={setDecision}
            decisionCopy={decisionCopy}
            DecisionIcon={DecisionIcon}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="glass-panel rounded-xl p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-blue">
              Brand
            </p>
            <img
              src={wordmark}
              alt="SkillGuard wordmark"
              className="mt-5 w-full max-w-xl rounded-lg border border-border-subtle bg-bg-900 p-5"
            />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <BrandTile title="Voice" value="Calm, precise, protective" />
              <BrandTile title="Position" value="Wallet-grade control surface" />
              <BrandTile title="Audience" value="Solana builders and agent users" />
              <BrandTile title="Promise" value="Know, approve, revoke, prove" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {systemCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.06, duration: 0.45 }}
                className="rounded-xl border border-border-subtle bg-surface-900/70 p-5"
              >
                <card.icon className="h-5 w-5 text-brand-mint" />
                <h2 className="mt-4 text-lg font-semibold">{card.title}</h2>
                <p className="mt-2 text-sm leading-6 text-text-secondary">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="glass-panel rounded-xl p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-mint">
              System design
            </p>
            <h2 className="mt-3 text-2xl font-bold">Tokens that map to product risk.</h2>
            <div className="mt-6 grid gap-3">
              {colorTokens.map((token) => (
                <div
                  key={token.name}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-900/60 p-3"
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
                  <p className="max-w-[180px] text-right text-sm text-text-secondary">
                    {token.role}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-violet">
              Interface rules
            </p>
            <h2 className="mt-3 text-2xl font-bold">Every request shows the wallet impact first.</h2>
            <div className="mt-6 space-y-3">
              {[
                "Agent name and requested action are always visible.",
                "Network badge appears before approval.",
                "Spending actions require explicit user signing in the MVP.",
                "Revoked agents cannot create new requests.",
                "Receipts use hashes, signatures, and policy status.",
              ].map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-3 rounded-lg border border-border-subtle bg-bg-900/60 p-3 text-sm text-text-secondary"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-mint" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img src={iconMark} alt="SkillGuard icon" className="h-11 w-11 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-text-primary">SkillGuard</p>
          <p className="text-xs text-text-muted">Project Site</p>
        </div>
      </div>
      <div className="hidden items-center gap-2 rounded-full border border-border-subtle bg-surface-900/70 px-3 py-2 text-xs text-text-secondary sm:flex">
        <Radio className="h-3.5 w-3.5 text-brand-mint" />
        Demo system online
      </div>
    </header>
  );
}

function ActionButton({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <button className="inline-flex h-11 items-center gap-2 rounded-lg border border-border-subtle bg-surface-900 px-4 text-sm font-semibold text-text-primary transition hover:border-brand-mint/40 hover:bg-surface-800">
      <Icon className="h-4 w-4 text-brand-mint" />
      {children}
    </button>
  );
}

function BrandTile({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-900/60 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-text-muted">{title}</p>
      <p className="mt-2 text-sm font-semibold text-text-primary">{value}</p>
    </div>
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
  decisionCopy: {
    label: string;
    tone: string;
    border: string;
    background: string;
  };
  DecisionIcon: typeof CircleDot;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut", delay: 0.12 }}
      className="mx-auto w-full max-w-[430px]"
    >
      <div className="rounded-[34px] border border-white/10 bg-black p-3 shadow-[0_36px_110px_rgba(0,0,0,0.55)]">
        <div className="overflow-hidden rounded-[26px] border border-border-subtle bg-bg-900">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={iconMark} alt="" className="h-9 w-9 rounded-lg" />
              <div>
                <p className="text-sm font-semibold">SkillGuard</p>
                <p className="text-xs text-text-muted">Solana devnet</p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${decisionCopy.border} ${decisionCopy.background} ${decisionCopy.tone}`}
            >
              <DecisionIcon className="h-3.5 w-3.5" />
              {decisionCopy.label}
            </span>
          </div>

          <div className="space-y-4 p-4">
            <div className="rounded-xl border border-border-subtle bg-surface-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Research Agent</p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Requests a Jupiter swap route to rebalance a demo wallet position.
                  </p>
                </div>
                <span className="rounded-md bg-brand-blue/10 px-2 py-1 text-xs font-semibold text-brand-blue">
                  active
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-900 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Permission policy</p>
                <button
                  type="button"
                  className="rounded-md border border-brand-violet/30 px-2.5 py-1 text-xs font-semibold text-brand-violet transition hover:bg-brand-violet/10"
                  onClick={() => setDecision("revoked")}
                >
                  Revoke
                </button>
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

            <div className={`rounded-xl border p-4 ${decisionCopy.border} ${decisionCopy.background}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Wallet impact</p>
                  <p className="mt-1 text-xs text-text-secondary">Estimated spend: 8.42 USDC</p>
                </div>
                <ChevronRight className={`h-4 w-4 ${decisionCopy.tone}`} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                <Metric label="Policy" value="Pass" tone="text-brand-mint" />
                <Metric label="Cap" value="12 USDC" tone="text-brand-blue" />
                <Metric label="Risk" value="Medium" tone="text-status-warning" />
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

            <div className="rounded-xl border border-border-subtle bg-surface-900 p-4">
              <p className="text-sm font-semibold">Receipt timeline</p>
              <div className="mt-3 space-y-3">
                {receiptEvents.map((event, index) => (
                  <div key={event} className="flex gap-3 text-xs text-text-secondary">
                    <span className="mt-1 h-2 w-2 rounded-full bg-brand-mint" />
                    <div>
                      <p>{event}</p>
                      <p className="mt-1 font-mono text-[11px] text-text-muted">
                        sg_{index + 1}_9x8f...dev
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-bg-950/50 p-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-text-muted">{label}</p>
      <p className={`mt-1 font-semibold ${tone}`}>{value}</p>
    </div>
  );
}

export default App;
