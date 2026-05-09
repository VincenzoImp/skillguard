export interface PushNotificationPermission {
  granted?: boolean;
  status?: string;
}

export interface PushNotificationAdapters {
  device: {
    isDevice: boolean;
  };
  notifications: {
    getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
    getPermissionsAsync(): Promise<PushNotificationPermission>;
    requestPermissionsAsync(): Promise<PushNotificationPermission>;
    setNotificationChannelAsync?: (
      channelId: string,
      options: {
        importance: string;
        lightColor: string;
        vibrationPattern: number[];
      }
    ) => Promise<unknown>;
  };
  platform: {
    OS: string;
  };
  projectId?: string;
}

export type PushRegistrationResult =
  | {
      status: "registered";
      token: string;
    }
  | {
      reason: "denied" | "simulator" | "unavailable";
      status: "skipped";
    };

export async function registerForPushNotificationsAsync({
  device,
  notifications,
  platform,
  projectId,
}: PushNotificationAdapters): Promise<PushRegistrationResult> {
  if (!device.isDevice) {
    return { reason: "simulator", status: "skipped" };
  }

  try {
    if (platform.OS === "android") {
      await notifications.setNotificationChannelAsync?.("skillguard-actions", {
        importance: "max",
        lightColor: "#10b981",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    let permission = await notifications.getPermissionsAsync();
    if (!isPermissionGranted(permission)) {
      permission = await notifications.requestPermissionsAsync();
    }
    if (!isPermissionGranted(permission)) {
      return { reason: "denied", status: "skipped" };
    }

    const token = await notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return { status: "registered", token: token.data };
  } catch {
    return { reason: "unavailable", status: "skipped" };
  }
}

export function actionIdFromNotificationResponse(response: unknown): string | null {
  const data = readNotificationData(response);
  return typeof data?.actionId === "string" ? data.actionId : null;
}

function isPermissionGranted(permission: PushNotificationPermission): boolean {
  return permission.granted === true || permission.status === "granted";
}

function readNotificationData(response: unknown): Record<string, unknown> | null {
  if (!isRecord(response)) return null;
  const notification = response.notification;
  if (!isRecord(notification)) return null;
  const request = notification.request;
  if (!isRecord(request)) return null;
  const content = request.content;
  if (!isRecord(content)) return null;
  const data = content.data;
  return isRecord(data) ? data : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
