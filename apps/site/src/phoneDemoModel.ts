export const phoneDemoTabs = [
  { id: "home", label: "Home" },
  { id: "inbox", label: "Inbox" },
  { id: "agents", label: "Agents" },
  { id: "pair", label: "Pair" },
  { id: "activity", label: "Activity" },
] as const;

export type PhoneDemoTabId = (typeof phoneDemoTabs)[number]["id"];

export const defaultPhoneDemoTab: PhoneDemoTabId = "home";
