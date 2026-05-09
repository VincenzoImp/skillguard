import { describe, expect, it } from "vitest";

import { firewallHero, siteRoutes } from "./siteNavigation";

describe("siteNavigation", () => {
  it("defines the public product routes for judges and developers", () => {
    expect(siteRoutes.map((route) => route.path)).toEqual([
      "/",
      "/demo",
      "/how-it-works",
      "/developers",
    ]);
  });

  it("keeps the public pitch focused on the agent wallet-control gap", () => {
    expect(firewallHero.title).toBe("Let AI agents use your wallet without handing them your wallet.");
    expect(firewallHero.subhead).toMatch(/transaction firewall/i);
    expect(firewallHero.primaryCta).toBe("Open the 3-minute demo");
    expect(firewallHero.secondaryCta).toBe("See how it works");
  });
});
