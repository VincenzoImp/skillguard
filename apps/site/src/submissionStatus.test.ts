import { describe, expect, it } from "vitest";
import { roadmapItems } from "./submissionStatus";

describe("submissionStatus", () => {
  it("marks verified local submission proofs with non-pending statuses", () => {
    expect(statusFor("MWA record_decision proof")).toBe("done");
    expect(statusFor("Devnet program deploy")).toBe("done");
    expect(statusFor("Release APK signing pipeline")).toBe("done");
    expect(statusFor("Final upload key")).toBe("done");
    expect(statusFor("Public project site")).toBe("done");
  });

  it("keeps account-owned and human-owned submission steps external", () => {
    expect(statusFor("Demo video")).toBe("external");
  });

  it("marks the owner keystore backup as completed after password-manager storage", () => {
    expect(statusFor("Password manager backup")).toBe("done");
  });
});

function statusFor(title: string) {
  const item = roadmapItems.find((roadmapItem) => roadmapItem.title === title);

  if (!item) {
    throw new Error(`Missing roadmap item: ${title}`);
  }

  return item.status;
}
