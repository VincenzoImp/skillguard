import { describe, expect, it } from "vitest";

import { defaultPhoneDemoTab, phoneDemoTabs } from "./phoneDemoModel";

describe("phoneDemoModel", () => {
  it("models the real app tab order used by the phone preview", () => {
    expect(phoneDemoTabs.map((tab) => tab.id)).toEqual([
      "home",
      "inbox",
      "agents",
      "pair",
      "activity",
    ]);
    expect(phoneDemoTabs.map((tab) => tab.label)).toEqual([
      "Home",
      "Inbox",
      "Agents",
      "Pair",
      "Activity",
    ]);
  });

  it("opens on the app home screen instead of the request inbox", () => {
    expect(defaultPhoneDemoTab).toBe("home");
  });
});
