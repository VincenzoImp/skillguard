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
  title: "Give AI agents wallet access without giving up control.",
  subhead:
    "SkillGuard is a transaction firewall for onchain AI agents. Pair an agent, define exactly what it can do, auto-allow low-risk work, require consent for spending, block out-of-policy requests, and revoke access anytime.",
  primaryCta: "Open the 3-minute demo",
  secondaryCta: "See how it works",
};
