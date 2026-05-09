import { describe, expect, test } from "vitest";

import { sendExpoPushNotifications } from "./push.js";

describe("Expo push wrapper", () => {
  test("sends one notification per token", async () => {
    const requests: unknown[] = [];
    const result = await sendExpoPushNotifications({
      fetch: async (_url, init) => {
        requests.push(JSON.parse(String(init?.body)));
        return jsonResponse({ data: [{ status: "ok" }] });
      },
      message: { body: "Action title", data: { actionId: "action-1" }, title: "Agent" },
      tokens: ["ExponentPushToken[token-1]"],
    });

    expect(result).toEqual({ deadTokens: [], sent: 1 });
    expect(requests[0]).toMatchObject({
      body: "Action title",
      data: { actionId: "action-1" },
      title: "Agent",
      to: "ExponentPushToken[token-1]",
    });
  });

  test("reports DeviceNotRegistered tokens as dead", async () => {
    const result = await sendExpoPushNotifications({
      fetch: async () =>
        jsonResponse({
          data: [
            {
              details: { error: "DeviceNotRegistered" },
              status: "error",
            },
          ],
        }),
      message: { body: "Action title", data: { actionId: "action-1" }, title: "Agent" },
      tokens: ["ExponentPushToken[dead]"],
    });

    expect(result).toEqual({ deadTokens: ["ExponentPushToken[dead]"], sent: 0 });
  });

  test("retries once after Expo returns a rate limit", async () => {
    let attempts = 0;
    const result = await sendExpoPushNotifications({
      fetch: async () => {
        attempts += 1;
        if (attempts === 1) return jsonResponse({ error: "rate limited" }, 429);
        return jsonResponse({ data: [{ status: "ok" }] });
      },
      message: { body: "Action title", data: { actionId: "action-1" }, title: "Agent" },
      retryDelayMs: 1,
      sleep: async () => undefined,
      tokens: ["ExponentPushToken[token-1]"],
    });

    expect(result).toEqual({ deadTokens: [], sent: 1 });
    expect(attempts).toBe(2);
  });
});

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    headers: { "content-type": "application/json" },
    status,
  });
}
