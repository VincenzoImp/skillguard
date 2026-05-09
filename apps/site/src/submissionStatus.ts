export type RoadmapStatus = "done" | "ready" | "external";

export type RoadmapItem = {
  step: string;
  title: string;
  status: RoadmapStatus;
  note: string;
};

export const roadmapItems: RoadmapItem[] = [
  {
    step: "1",
    title: "MWA record_decision proof",
    status: "done",
    note: "A real Android Mobile Wallet Adapter flow wrote a finalized devnet receipt.",
  },
  {
    step: "2",
    title: "Devnet program deploy",
    status: "done",
    note: "The Anchor program and IDL are deployed and documented for judges.",
  },
  {
    step: "3",
    title: "Release APK signing pipeline",
    status: "done",
    note: "Release signing is verified with an external keystore path and no secrets in git.",
  },
  {
    step: "4",
    title: "GitHub Pages workflow",
    status: "ready",
    note: "The static site can deploy through GitHub Actions after Pages is enabled.",
  },
  {
    step: "5",
    title: "Final upload key",
    status: "done",
    note: "The owner-controlled Android upload keystore was generated outside git and used for the current release APK.",
  },
  {
    step: "6",
    title: "Password manager backup",
    status: "external",
    note: "The keystore and signing env must be imported into the owner's password manager.",
  },
  {
    step: "7",
    title: "Demo video",
    status: "external",
    note: "The under-3-minute recording needs final human review and narration.",
  },
];
