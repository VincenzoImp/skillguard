export interface ReceiptSignatureInfo {
  signature: string;
}

export function latestReceiptSignature(
  signatures: readonly ReceiptSignatureInfo[]
): string | null {
  return signatures[0]?.signature ?? null;
}
