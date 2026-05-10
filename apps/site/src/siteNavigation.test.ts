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
    expect(firewallHero.title).toBe("Give AI agents wallet access without giving up control.");
    expect(firewallHero.subhead).toMatch(/transaction firewall/i);
    expect(firewallHero.subhead).toMatch(/revoke access anytime/i);
    expect(firewallHero.primaryCta).toBe("Open the 3-minute demo");
    expect(firewallHero.primaryCtaHref).toBe("https://youtu.be/sb2B-vPU9l8");
    expect(firewallHero.secondaryCta).toBe("See how it works");
  });
});
