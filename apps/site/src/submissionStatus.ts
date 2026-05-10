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
    title: "Mobile wallet receipt proof",
    status: "done",
    note: "The Android app signs through Mobile Wallet Adapter and writes a finalized devnet decision receipt.",
  },
  {
    step: "2",
    title: "Devnet receipt program",
    status: "done",
    note: "The Anchor receipt program and IDL are deployed on Solana devnet and linked from the docs.",
  },
  {
    step: "3",
    title: "Release APK signing pipeline",
    status: "done",
    note: "The release APK is signed from an external keystore path; no signing secrets are committed.",
  },
  {
    step: "4",
    title: "Public project site",
    status: "done",
    note: "Vercel serves the public pitch, demo runbook, and hosted API at skillguard-sol.vercel.app.",
  },
  {
    step: "5",
    title: "Final upload key",
    status: "done",
    note: "The owner-controlled Android upload keystore was generated outside git and used for the release APK.",
  },
  {
    step: "6",
    title: "Password manager backup",
    status: "done",
    note: "The final upload keystore and signing environment are backed up in the owner password manager.",
  },
  {
    step: "7",
    title: "Demo video",
    status: "external",
    note: "The remaining human task is recording the under-three-minute narrated walkthrough.",
  },
];
