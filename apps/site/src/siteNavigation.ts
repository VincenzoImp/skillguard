export type SiteRoute = {
  label: string;
  path: "/" | "/demo" | "/architecture" | "/developers" | "/about";
};

export const siteRoutes: SiteRoute[] = [
  { label: "Home", path: "/" },
  { label: "Demo", path: "/demo" },
  { label: "Architecture", path: "/architecture" },
  { label: "Developers", path: "/developers" },
  { label: "About", path: "/about" },
];

export const firewallHero = {
  title: "The firewall between AI agents and your Solana wallet.",
  subhead: "Agents ask. Policies filter. You approve. Solana records the proof.",
  primaryCta: "Watch 90s demo",
  secondaryCta: "Integrate an agent",
};
