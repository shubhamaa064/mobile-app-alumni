import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { subscribePush, unsubscribePush } from "./api";

/* ------------------------------------------------------------------ *
 * Channels — Zomato/Swiggy-style: each content type its own channel so
 * users can fine-tune what buzzes their phone from system settings.
 * ------------------------------------------------------------------ */
export type ChannelId = "events" | "fame" | "community" | "general";

export const CHANNELS: {
  id: ChannelId;
  name: string;
  description: string;
  importance: Notifications.AndroidImportance;
  icon: keyof typeof import("@expo/vector-icons").Ionicons.glyphMap;
}[] = [
  { id: "events", name: "Events & Reunions", description: "Upcoming meets, reminders and registrations", importance: Notifications.AndroidImportance.HIGH, icon: "calendar" },
  { id: "fame", name: "Wall of Fame & News", description: "Alumni achievements and announcements", importance: Notifications.AndroidImportance.DEFAULT, icon: "ribbon" },
  { id: "community", name: "Community", description: "Sewa drives, jobs and member updates", importance: Notifications.AndroidImportance.DEFAULT, icon: "people" },
  { id: "general", name: "General", description: "Everything else from CTK Alumni", importance: Notifications.AndroidImportance.DEFAULT, icon: "notifications" },
];

const GOLD = "#C8A24B";

/* ------------------------------------------------------------------ *
 * Data payload carried on every notification → drives deep-linking.
 * ------------------------------------------------------------------ */
export type NotifData = {
  type?: "event" | "news" | "alumni" | "album" | "job" | "general";
  id?: string;
  channelId?: ChannelId;
  url?: string;
};

export function routeFromData(data: NotifData | undefined): string {
  if (!data) return "/inbox";
  switch (data.type) {
    case "event":
      return data.id ? `/event/${data.id}` : "/events";
    case "news":
      return data.id ? `/news/${data.id}` : "/news";
    case "alumni":
      return data.id ? `/alumni/${data.id}` : "/alumni";
    case "album":
      return data.id ? `/album/${data.id}` : "/gallery";
    case "job":
      return "/jobs";
    default:
      return "/inbox";
  }
}

let configured = false;

/** Install the foreground handler + create Android channels. Call once at boot. */
export async function configureNotifications(): Promise<void> {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === "android") {
    for (const ch of CHANNELS) {
      await Notifications.setNotificationChannelAsync(ch.id, {
        name: ch.name,
        description: ch.description,
        importance: ch.importance,
        lightColor: GOLD,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
      });
    }
  }
}

export async function getPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Ask the OS for permission. Only shows the system prompt when it still can
 * (`canAskAgain`); once the user has hard-denied, Android/iOS won't prompt again
 * and the caller must send them to system settings instead.
 */
export async function requestPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  let perm = await Notifications.getPermissionsAsync();
  if (perm.status !== "granted" && perm.canAskAgain) {
    perm = await Notifications.requestPermissionsAsync();
  }
  return { granted: perm.status === "granted", canAskAgain: perm.canAskAgain };
}

function getProjectId(): string | undefined {
  return (
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ||
    (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  );
}

const DEVICE_ID_KEY = "push.deviceId";

/** A stable, app-scoped device id the backend keys push subscriptions on. */
async function getDeviceId(): Promise<string> {
  try {
    let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (!id) {
      id =
        (globalThis.crypto as { randomUUID?: () => string } | undefined)?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return `${Device.modelName ?? "device"}-${Date.now()}`;
  }
}

/**
 * Fetch the Expo push token and register it with the backend via the documented
 * POST /api/push/subscribe endpoint (best-effort, auth required). Remote
 * delivery needs a dev/standalone build + an EAS projectId; in Expo Go this
 * no-ops gracefully so local notifications still work.
 */
export async function registerForPushAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;
  const projectId = getProjectId();
  if (!projectId) return null;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;
    const deviceId = await getDeviceId();
    subscribePush(token, deviceId).catch(() => {});
    return token;
  } catch {
    return null;
  }
}

export async function unregisterPush(token: string | null): Promise<void> {
  if (!token) return;
  unsubscribePush(token).catch(() => {});
}

/** Present a notification immediately (used for welcome + the in-app "test"). */
export async function presentNow(title: string, body: string, data: NotifData = {}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null,
  });
}

/** Schedule a local notification N seconds from now on a given channel. */
export async function scheduleIn(
  seconds: number,
  title: string,
  body: string,
  data: NotifData = {},
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, Math.round(seconds)),
      channelId: data.channelId ?? "general",
    },
  });
}

/** Schedule a reminder for an event (a day before, or 1 min out for demo). */
export async function scheduleEventReminder(eventId: string, title: string, dateIso: string): Promise<void> {
  const eventTime = new Date(dateIso).getTime();
  const dayBefore = eventTime - 24 * 60 * 60 * 1000;
  const secondsUntil = (dayBefore - Date.now()) / 1000;
  const seconds = secondsUntil > 60 ? secondsUntil : 60; // demo fallback if event is near/past
  await scheduleIn(seconds, "Reunion reminder 🎓", `"${title}" is coming up — see you there!`, {
    type: "event",
    id: eventId,
    channelId: "events",
  });
}

export async function setBadgeCount(n: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(n);
  } catch {
    // ignore
  }
}
