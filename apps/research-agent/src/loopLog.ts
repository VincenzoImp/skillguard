import type { LoopActionKind } from "./loopActions.js";

type PolicyStatus = "fail" | "pass" | "requires_approval";
type DecisionStatus = "approved" | "blocked" | "expired" | "rejected" | "revoked" | "timeout";

export interface LoopLogger {
  banner(wallet: string): void;
  blocked(kind: LoopActionKind, reasons: string[]): void;
  cycleEnd(delayMs: number): void;
  decision(kind: LoopActionKind, status: DecisionStatus, signature?: string | null): void;
  revoked(): void;
  submitted(kind: LoopActionKind, actionId: string, status: PolicyStatus, reasons: string[]): void;
}

export function createLoopLogger({
  quiet = process.env.SKILLGUARD_LOOP_QUIET === "1",
  write = console.log,
}: {
  quiet?: boolean;
  write?: (line: string) => void;
} = {}): LoopLogger {
  const label = (quietLabel: string, emoji: string) => (quiet ? quietLabel : emoji);
  return {
    banner(wallet) {
      write(`${label("[BANNER]", "🤖")} Agent started, watching wallet ${shortenAddress(wallet)}`);
    },
    blocked(kind, reasons) {
      write(`${label("[BLOCK]", "🔒")} ${kind} BLOCKED reasons=${reasons.join(",")}`);
    },
    cycleEnd(delayMs) {
      write(`${label("[CYCLE]", "↻")} Cycle complete. Restarting in ${delayMs}ms`);
    },
    decision(kind, status, signature) {
      const upper = status.toUpperCase();
      const suffix = signature ? ` signature=${signature}` : "";
      write(`${label(status === "approved" ? "[OK]" : "[DECISION]", status === "approved" ? "✅" : "•")} ${kind} ${upper}${suffix}`);
    },
    revoked() {
      write(`${label("[REVOKED]", "🛑")} Agent connection revoked. Exiting loop.`);
    },
    submitted(kind, actionId, status, reasons) {
      write(
        `${label("[SUBMIT]", "→")} ${kind} ${actionId} policy=${status} reasons=${reasons.join(",")}`
      );
    },
  };
}

export function shortenAddress(value: string): string {
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
