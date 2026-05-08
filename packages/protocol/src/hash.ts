import { createHash } from "node:crypto";

import type { ActionManifest } from "./types.js";

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  const record = value as Record<string, unknown>;

  return Object.fromEntries(
    Object.keys(record)
      .sort()
      .map((key) => [key, sortKeys(record[key])]),
  );
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function hashActionManifest(manifest: ActionManifest): string {
  return createHash("sha256").update(canonicalJson(manifest)).digest("hex");
}
