import { describe, expect, it } from "vitest";

import { latestReceiptSignature } from "./receiptRecovery";

describe("receipt recovery", () => {
  it("uses the newest transaction signature for an existing receipt account", () => {
    expect(
      latestReceiptSignature([
        { signature: "newer-signature" },
        { signature: "older-signature" },
      ])
    ).toBe("newer-signature");
  });

  it("returns null when no receipt signatures are available", () => {
    expect(latestReceiptSignature([])).toBeNull();
  });
});
