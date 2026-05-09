import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import {
  actionIdFromNotificationResponse,
  registerForPushNotificationsAsync,
} from "./pushNotifications";

export function configureSkillGuardNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      priority: Notifications.AndroidNotificationPriority.HIGH,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function registerSkillGuardDevicePushToken() {
  return registerForPushNotificationsAsync({
    device: { isDevice: Device.isDevice },
    notifications: {
      getExpoPushTokenAsync: (options) => Notifications.getExpoPushTokenAsync(options),
      getPermissionsAsync: () => Notifications.getPermissionsAsync(),
      requestPermissionsAsync: () => Notifications.requestPermissionsAsync(),
      setNotificationChannelAsync: async (channelId, options) => {
        await Notifications.setNotificationChannelAsync(channelId, {
          importance: Notifications.AndroidImportance.MAX,
          lightColor: options.lightColor,
          name: "SkillGuard requests",
          vibrationPattern: options.vibrationPattern,
        });
      },
    },
    platform: { OS: Platform.OS },
    projectId: expoProjectId(),
  });
}

export function addSkillGuardNotificationResponseListener(
  onActionId: (actionId: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = actionIdFromNotificationResponse(response);
    if (actionId) {
      onActionId(actionId);
    }
  });
  return () => subscription.remove();
}

export async function readInitialNotificationActionId(): Promise<string | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  return actionIdFromNotificationResponse(response);
}

function expoProjectId(): string | undefined {
  const constants = Constants as {
    easConfig?: { projectId?: string };
    expoConfig?: {
      extra?: {
        eas?: {
          projectId?: string;
        };
      };
    };
  };
  return constants.easConfig?.projectId ?? constants.expoConfig?.extra?.eas?.projectId;
}
