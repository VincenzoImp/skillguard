import { describe, expect, test } from "vitest";

import { SkillGuardStore } from "./store.js";

describe("SkillGuardStore push tokens", () => {
  test("stores wallet push tokens idempotently and persists them in snapshots", () => {
    const store = new SkillGuardStore({ actions: [], agents: [], connections: [] });

    store.addPushToken("Wallet111", "ExponentPushToken[token-1]");
    store.addPushToken("Wallet111", "ExponentPushToken[token-1]");
    store.addPushToken("Wallet111", "ExponentPushToken[token-2]");

    expect(store.listPushTokens("Wallet111")).toEqual([
      "ExponentPushToken[token-1]",
      "ExponentPushToken[token-2]",
    ]);

    const restored = new SkillGuardStore(store.toSnapshot());
    expect(restored.listPushTokens("Wallet111")).toEqual([
      "ExponentPushToken[token-1]",
      "ExponentPushToken[token-2]",
    ]);
  });

  test("removes push tokens and leaves other wallets untouched", () => {
    const store = new SkillGuardStore({ actions: [], agents: [], connections: [] });

    store.addPushToken("Wallet111", "ExponentPushToken[token-1]");
    store.addPushToken("Wallet222", "ExponentPushToken[token-2]");
    store.removePushToken("Wallet111", "ExponentPushToken[token-1]");

    expect(store.listPushTokens("Wallet111")).toEqual([]);
    expect(store.listPushTokens("Wallet222")).toEqual(["ExponentPushToken[token-2]"]);
  });
});
