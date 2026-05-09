import { describe, expect, it, vi } from "vitest";

import {
  actionIdFromNotificationResponse,
  registerForPushNotificationsAsync,
} from "./pushNotifications";

describe("mobile push notification helpers", () => {
  it("skips registration on simulators", async () => {
    const result = await registerForPushNotificationsAsync({
      device: { isDevice: false },
      notifications: notificationAdapter(),
      platform: { OS: "android" },
    });

    expect(result).toEqual({ reason: "simulator", status: "skipped" });
  });

  it("requests permission before returning an Expo push token", async () => {
    const setNotificationChannelAsync = vi.fn(async () => undefined);
    const getExpoPushTokenAsync = vi.fn(async () => ({
      data: "ExponentPushToken[token-1]",
    }));

    const result = await registerForPushNotificationsAsync({
      device: { isDevice: true },
      notifications: notificationAdapter({
        getExpoPushTokenAsync,
        getPermissionsAsync: async () => ({ status: "undetermined" }),
        requestPermissionsAsync: async () => ({ status: "granted" }),
        setNotificationChannelAsync,
      }),
      platform: { OS: "android" },
      projectId: "project-123",
    });

    expect(result).toEqual({
      status: "registered",
      token: "ExponentPushToken[token-1]",
    });
    expect(setNotificationChannelAsync).toHaveBeenCalledWith("skillguard-actions", {
      importance: "max",
      lightColor: "#10b981",
      vibrationPattern: [0, 250, 250, 250],
    });
    expect(getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: "project-123" });
  });

  it("reports denied permissions without requesting a token", async () => {
    const getExpoPushTokenAsync = vi.fn(async () => ({
      data: "ExponentPushToken[token-1]",
    }));

    const result = await registerForPushNotificationsAsync({
      device: { isDevice: true },
      notifications: notificationAdapter({
        getExpoPushTokenAsync,
        getPermissionsAsync: async () => ({ status: "denied" }),
        requestPermissionsAsync: async () => ({ status: "denied" }),
      }),
      platform: { OS: "ios" },
    });

    expect(result).toEqual({ reason: "denied", status: "skipped" });
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it("extracts an action id from a notification response", () => {
    expect(
      actionIdFromNotificationResponse({
        notification: {
          request: {
            content: {
              data: { actionId: "action-123", kind: "new_action" },
            },
          },
        },
      })
    ).toBe("action-123");
    expect(
      actionIdFromNotificationResponse({
        notification: { request: { content: { data: { actionId: 123 } } } },
      })
    ).toBeNull();
  });
});

function notificationAdapter(overrides: Partial<PushNotificationAdapter> = {}) {
  return {
    getExpoPushTokenAsync: async () => ({ data: "ExponentPushToken[token]" }),
    getPermissionsAsync: async () => ({ status: "granted" }),
    requestPermissionsAsync: async () => ({ status: "granted" }),
    ...overrides,
  } satisfies PushNotificationAdapter;
}

interface PushNotificationAdapter {
  getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  getPermissionsAsync(): Promise<{ granted?: boolean; status?: string }>;
  requestPermissionsAsync(): Promise<{ granted?: boolean; status?: string }>;
  setNotificationChannelAsync?: (
    channelId: string,
    options: Record<string, unknown>
  ) => Promise<unknown>;
}
