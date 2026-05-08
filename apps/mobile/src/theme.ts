import type { ActionStatus, PolicyMode, RiskTone } from "./demoState";

export const colors = {
  bg: "#030712",
  deep: "#070D18",
  surface: "#0B1220",
  surfaceActive: "#111827",
  border: "rgba(148,163,184,0.16)",
  borderStrong: "rgba(248,250,252,0.18)",
  text: "#F8FAFC",
  textSecondary: "#A7B0C0",
  textMuted: "#6B7280",
  mint: "#00F0A8",
  mintText: "#03130D",
  warning: "#F5B84B",
  danger: "#FF5A68",
  info: "#58A6FF",
  revoked: "#8B5CF6",
};

export const toneColors: Record<
  RiskTone,
  { bg: string; border: string; fg: string }
> = {
  danger: {
    bg: "rgba(255,90,104,0.12)",
    border: "rgba(255,90,104,0.4)",
    fg: colors.danger,
  },
  info: {
    bg: "rgba(88,166,255,0.1)",
    border: "rgba(88,166,255,0.36)",
    fg: colors.info,
  },
  safe: {
    bg: "rgba(0,240,168,0.1)",
    border: "rgba(0,240,168,0.36)",
    fg: colors.mint,
  },
  warning: {
    bg: "rgba(245,184,75,0.12)",
    border: "rgba(245,184,75,0.38)",
    fg: colors.warning,
  },
};

export function labelForPolicyMode(mode: PolicyMode): string {
  if (mode === "allow_under_limits") return "Allow under limits";
  if (mode === "block") return "Block";
  return "Ask every time";
}

export function labelForStatus(status: ActionStatus): string {
  if (status === "approved") return "Approved";
  if (status === "blocked") return "Blocked";
  if (status === "rejected") return "Rejected";
  return "Pending";
}

export function toneForStatus(status: ActionStatus): RiskTone {
  if (status === "approved") return "safe";
  if (status === "blocked" || status === "rejected") return "danger";
  return "warning";
}
