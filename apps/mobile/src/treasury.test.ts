import { describe, expect, it } from "vitest";
import { PublicKey } from "@solana/web3.js";
import { RESEARCH_TREASURY_ADDRESS } from "./treasury";

describe("RESEARCH_TREASURY_ADDRESS", () => {
  it("is a valid base58 Solana public key", () => {
    expect(() => new PublicKey(RESEARCH_TREASURY_ADDRESS)).not.toThrow();
  });

  it("is exactly 32 bytes when decoded", () => {
    const bytes = new PublicKey(RESEARCH_TREASURY_ADDRESS).toBytes();
    expect(bytes.length).toBe(32);
  });
});
