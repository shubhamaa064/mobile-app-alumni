import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import {
  configureNotifications,
  getPermissionStatus,
  registerForPushAsync,
  routeFromData,
  setBadgeCount,
  type NotifData,
} from "./notifications";

const INBOX_KEY = "ctk_inbox_v1";
const PRIMER_KEY = "ctk_primer_seen_v1";
const MAX_ITEMS = 60;

export type InboxItem = {
  id: string;
  title: string;
  body: string;
  data: NotifData;
  receivedAt: number;
  read: boolean;
};

type InboxState = {
  items: InboxItem[];
  unread: number;
  ready: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Locally record a notification (used for the in-app "test" + welcome). */
  record: (title: string, body: string, data?: NotifData) => void;
};

const InboxContext = createContext<InboxState | undefined>(undefined);

function notifToItem(n: Notifications.Notification): InboxItem {
  const c = n.request.content;
  return {
    id: n.request.identifier || String(Date.now()),
    title: c.title ?? "CTK Alumni",
    body: c.body ?? "",
    data: (c.data ?? {}) as NotifData,
    receivedAt: n.date ? n.date * 1000 : Date.now(),
    read: false,
  };
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [ready, setReady] = useState(false);
  const hydrated = useRef(false);

  const persist = useCallback((next: InboxItem[]) => {
    AsyncStorage.setItem(INBOX_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const upsert = useCallback(
    (updater: (prev: InboxItem[]) => InboxItem[]) => {
      setItems((prev) => {
        const next = updater(prev).slice(0, MAX_ITEMS);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const addNotification = useCallback(
    (n: Notifications.Notification) => {
      const item = notifToItem(n);
      upsert((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
    },
    [upsert],
  );

  const record = useCallback(
    (title: string, body: string, data: NotifData = {}) => {
      const item: InboxItem = {
        id: `local-${Date.now()}`,
        title,
        body,
        data,
        receivedAt: Date.now(),
        read: false,
      };
      upsert((prev) => [item, ...prev]);
    },
    [upsert],
  );

  const markRead = useCallback(
    (id: string) => upsert((prev) => prev.map((p) => (p.id === id ? { ...p, read: true } : p))),
    [upsert],
  );
  const markAllRead = useCallback(
    () => upsert((prev) => prev.map((p) => ({ ...p, read: true }))),
    [upsert],
  );
  const remove = useCallback((id: string) => upsert((prev) => prev.filter((p) => p.id !== id)), [upsert]);
  const clear = useCallback(() => upsert(() => []), [upsert]);

  // Hydrate from storage, configure channels, register push, and wire listeners.
  useEffect(() => {
    let received: Notifications.EventSubscription | undefined;
    let response: Notifications.EventSubscription | undefined;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(INBOX_KEY);
        if (raw) setItems(JSON.parse(raw) as InboxItem[]);
      } catch {
        // ignore corrupt store
      }
      hydrated.current = true;
      setReady(true);

      // Native notification APIs aren't available on web — skip the whole setup there.
      if (Platform.OS === "web") return;

      await configureNotifications();
      registerForPushAsync().catch(() => {});

      received = Notifications.addNotificationReceivedListener(addNotification);

      response = Notifications.addNotificationResponseReceivedListener((r) => {
        const data = (r.notification.request.content.data ?? {}) as NotifData;
        const id = r.notification.request.identifier;
        // ensure it's in the inbox + marked read, then deep-link
        addNotification(r.notification);
        if (id) setTimeout(() => markRead(id), 0);
        router.push(routeFromData(data) as never);
      });

      // Cold-start: app opened by tapping a notification.
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const data = (last.notification.request.content.data ?? {}) as NotifData;
        addNotification(last.notification);
        router.push(routeFromData(data) as never);
        return; // honour the deep-link; don't interrupt with the primer
      }

      // First-launch Zomato-style primer — only if the user hasn't decided yet.
      try {
        const seen = await AsyncStorage.getItem(PRIMER_KEY);
        const status = await getPermissionStatus();
        if (!seen && status === "undetermined") {
          await AsyncStorage.setItem(PRIMER_KEY, "1");
          setTimeout(() => router.push("/notify-primer"), 900);
        }
      } catch {
        // ignore — primer is best-effort
      }
    })();

    return () => {
      received?.remove();
      response?.remove();
    };
  }, [addNotification, markRead]);

  const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

  // Keep the app-icon badge in sync with unread count.
  useEffect(() => {
    if (hydrated.current) setBadgeCount(unread);
  }, [unread]);

  const value = useMemo<InboxState>(
    () => ({ items, unread, ready, markRead, markAllRead, remove, clear, record }),
    [items, unread, ready, markRead, markAllRead, remove, clear, record],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useInbox(): InboxState {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error("useInbox must be used within NotificationProvider");
  return ctx;
}
