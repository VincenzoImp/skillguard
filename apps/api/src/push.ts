const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export interface ExpoPushMessage {
  body: string;
  data: Record<string, unknown>;
  title: string;
}

export interface SendExpoPushInput {
  fetch?: FetchLike;
  message: ExpoPushMessage;
  retryDelayMs?: number;
  sleep?: (ms: number) => Promise<void>;
  tokens: string[];
}

export interface SendExpoPushResult {
  deadTokens: string[];
  sent: number;
}

export async function sendExpoPushNotifications({
  fetch: fetchImpl = globalThis.fetch,
  message,
  retryDelayMs = 500,
  sleep = defaultSleep,
  tokens,
}: SendExpoPushInput): Promise<SendExpoPushResult> {
  const deadTokens: string[] = [];
  let sent = 0;

  for (const token of tokens) {
    const response = await sendWithRetry(fetchImpl, token, message, retryDelayMs, sleep);
    if (response.status === "ok") {
      sent += 1;
    } else if (response.error === "DeviceNotRegistered") {
      deadTokens.push(token);
    }
  }

  return { deadTokens, sent };
}

async function sendWithRetry(
  fetchImpl: FetchLike,
  token: string,
  message: ExpoPushMessage,
  retryDelayMs: number,
  sleep: (ms: number) => Promise<void>
): Promise<{ error?: string; status: "error" | "ok" }> {
  const first = await sendOne(fetchImpl, token, message);
  if (first.rateLimited) {
    await sleep(retryDelayMs);
    return sendOne(fetchImpl, token, message);
  }
  return first;
}

async function sendOne(
  fetchImpl: FetchLike,
  token: string,
  message: ExpoPushMessage
): Promise<{ error?: string; rateLimited?: boolean; status: "error" | "ok" }> {
  const response = await fetchImpl(EXPO_PUSH_URL, {
    body: JSON.stringify({
      body: message.body,
      data: message.data,
      sound: "default",
      title: message.title,
      to: token,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

  if (response.status === 429) {
    return { rateLimited: true, status: "error" };
  }
  if (!response.ok) {
    return { status: "error" };
  }

  const payload = (await response.json()) as {
    data?: Array<{ details?: { error?: string }; status?: string }>;
  };
  const receipt = payload.data?.[0];
  if (receipt?.status === "ok") {
    return { status: "ok" };
  }
  return { error: receipt?.details?.error, status: "error" };
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
