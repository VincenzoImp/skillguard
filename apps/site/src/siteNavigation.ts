export type SiteRoute = {
  label: string;
  path: "/" | "/demo" | "/how-it-works" | "/developers";
};

export const siteRoutes: SiteRoute[] = [
  { label: "Home", path: "/" },
  { label: "Demo", path: "/demo" },
  { label: "How it works", path: "/how-it-works" },
  { label: "Developers", path: "/developers" },
];

export const firewallHero = {
  title: "Let AI agents use your wallet without handing them your wallet.",
  subhead:
    "SkillGuard is a transaction firewall for onchain AI agents: pair agents, set wallet permissions, auto-allow safe actions, require consent for sensitive ones, block dangerous requests, and revoke access anytime.",
  primaryCta: "Open the 3-minute demo",
  secondaryCta: "See how it works",
};
