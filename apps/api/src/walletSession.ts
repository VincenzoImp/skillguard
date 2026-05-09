import { createHash, randomBytes } from "node:crypto";

export const WALLET_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export function createWalletSessionToken(): string {
  return `sgw_${randomBytes(32).toString("base64url")}`;
}

export function hashWalletSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function walletSessionExpiresAt(now = Date.now()): number {
  return now + WALLET_SESSION_TTL_MS;
}
