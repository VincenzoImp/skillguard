import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { SOLANA_DEVNET_CHAIN, SOLANA_DEVNET_ENDPOINT } from "./wallet";

describe("mobile app config", () => {
  it("requests camera access for QR agent pairing", () => {
    const appConfig = JSON.parse(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), "../app.json"),
        "utf8"
      )
    );

    expect(appConfig.expo.plugins).toContainEqual([
      "expo-camera",
      {
        cameraPermission:
          "Allow SkillGuard to scan trusted agent pairing QR codes.",
      },
    ]);
  });

  it("uses explicit Solana devnet wallet authorization settings", () => {
    expect(SOLANA_DEVNET_CHAIN).toBe("solana:devnet");
    expect(SOLANA_DEVNET_CHAIN).not.toBe("solana:mainnet");
    expect(SOLANA_DEVNET_ENDPOINT).toBe("https://api.devnet.solana.com");
  });
});
