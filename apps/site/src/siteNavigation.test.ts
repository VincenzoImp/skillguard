import { describe, expect, it } from "vitest";

import { firewallHero, siteRoutes } from "./siteNavigation";

describe("siteNavigation", () => {
  it("defines the Vercel deep-link routes promised by the submission plan", () => {
    expect(siteRoutes.map((route) => route.path)).toEqual([
      "/",
      "/demo",
      "/architecture",
      "/developers",
      "/about",
    ]);
  });

  it("keeps the public pitch focused on the wallet firewall framing", () => {
    expect(firewallHero.title).toBe("The firewall between AI agents and your Solana wallet.");
    expect(firewallHero.primaryCta).toBe("Watch 90s demo");
    expect(firewallHero.secondaryCta).toBe("Integrate an agent");
  });
});
