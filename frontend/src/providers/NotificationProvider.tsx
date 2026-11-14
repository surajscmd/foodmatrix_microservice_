"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { io, type Socket } from "socket.io-client";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notification-api";

import { useOrganizationStore } from "@/store/organization-store";

import type {
  NotificationItem,
  NotificationScope,
} from "@/utils/types/notification";

interface NotificationContextValue {
  scope: NotificationScope;
  locationId: string;
  locationName: string;
  notificationsHref: string;

  preview: NotificationItem[];
  unreadCount: number;
  totalCount: number;

  loading: boolean;
  syncing: boolean;
  error: string;
  actionError: string;

  connected: boolean;
  lastUpdated: Date | null;
  revision: number;
  busyId: string | null;

  refresh: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext =
  createContext<NotificationContextValue | null>(null);

export function useNotifications() {
  return useContext(NotificationContext);
}

export default function NotificationProvider({
  children,
  scope,
}: {
  children: ReactNode;
  scope: NotificationScope;
}) {
  const franchise = useOrganizationStore((state) => state.franchise);

  const selectedRestaurant = useOrganizationStore(
    (state) => state.selectedRestaurant,
  );

  const currentUser = useOrganizationStore(
    (state) => state.currentUser,
  );

  const restaurants = useOrganizationStore(
    (state) => state.restaurants,
  );

  const restaurantId =
    currentUser?.systemUser.managedRestaurantId ||
    selectedRestaurant?.id ||
    "";

  const restaurantName =
    restaurants.find((item) => item.id === restaurantId)?.name ||
    (selectedRestaurant?.id === restaurantId
      ? selectedRestaurant.name
      : "") ||
    "Restaurant";

  const locationId =
    scope === "WAREHOUSE"
      ? franchise?.id ?? ""
      : restaurantId;

  const locationName =
    scope === "WAREHOUSE"
      ? franchise?.name ?? "Warehouse"
      : restaurantName;

  return (
    <NotificationSession
      key={`${scope}:${locationId}`}
      scope={scope}
      locationId={locationId}
      locationName={locationName}
    >
      {children}
    </NotificationSession>
  );
}

function NotificationSession({
  children,
  scope,
  locationId,
  locationName,
}: {
  children: ReactNode;
  scope: NotificationScope;
  locationId: string;
  locationName: string;
}) {
  const [preview, setPreview] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(Boolean(locationId));
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const [connected, setConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [revision, setRevision] = useState(0);
  const [syncKey, setSyncKey] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const mounted = useRef(false);
  const actionLock = useRef(false);

  const syncTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;

      if (syncTimer.current) {
        clearTimeout(syncTimer.current);
      }
    };
  }, []);

  const scheduleSync = useCallback(() => {
    if (!locationId || !mounted.current) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);

    syncTimer.current = setTimeout(() => {
      syncTimer.current = null;

      if (mounted.current) {
        setSyncKey((value) => value + 1);
      }
    }, 200);
  }, [locationId]);

  const refresh = useCallback(() => {
    if (!locationId) return;

    if (
      socketRef.current &&
      !socketRef.current.connected
    ) {
      socketRef.current.connect();
    }

    scheduleSync();
  }, [locationId, scheduleSync]);

  // Latest records and authoritative unread count.
  useEffect(() => {
    if (!locationId) return;

    const controller = new AbortController();

    const load = async () => {
      setSyncing(true);
      setError("");

      try {
        const [list, unread] = await Promise.all([
          getNotifications(
            scope,
            locationId,
            { page: 1, limit: 5 },
            { signal: controller.signal },
          ),
          getUnreadNotificationCount(
            scope,
            locationId,
            { signal: controller.signal },
          ),
        ]);

        if (controller.signal.aborted) return;

        const unique = new Map(
          list.data.map((item) => [item.id, item]),
        );

        setPreview([...unique.values()]);
        setUnreadCount(unread);
        setTotalCount(list.pagination.total);
        setLastUpdated(new Date());
        setRevision((value) => value + 1);
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load notifications.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSyncing(false);
        }
      }
    };

    void load();

    return () => controller.abort();
  }, [scope, locationId, syncKey]);

  // Live connection.
  useEffect(() => {
    if (!locationId) return;

    const origin = (
      process.env.NEXT_PUBLIC_NOTIFICATION_SOCKET_URL ??
      "http://localhost:8000"
    ).replace(/\/+$/, "");

    const socket = io(`${origin}/notifications`, {
      path: "/api/notification/socket.io",
      transports: ["websocket"],
      autoConnect: false,
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);

      if (scope === "WAREHOUSE") {
        socket.emit("join-warehouse", {
          warehouseId: locationId,
        });
      } else {
        socket.emit("join-restaurant", {
          restaurantId: locationId,
        });
      }

      scheduleSync();
    };

    const onDisconnect = () => setConnected(false);

    const onNotification = (payload: unknown) => {
      if (typeof payload !== "object" || payload === null) return;

      const item = payload as Record<string, unknown>;

      if (
        typeof item.id !== "string" ||
        item.scope !== scope
      ) {
        return;
      }

      const targetId =
        scope === "WAREHOUSE"
          ? item.warehouseId
          : item.restaurantId;

      if (targetId === locationId) {
        scheduleSync();
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onDisconnect);
    socket.on("notification:new", onNotification);

    socket.connect();

    return () => {
      if (socket.connected) {
        if (scope === "WAREHOUSE") {
          socket.emit("leave-warehouse", {
            warehouseId: locationId,
          });
        } else {
          socket.emit("leave-restaurant", {
            restaurantId: locationId,
          });
        }
      }

      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onDisconnect);
      socket.off("notification:new", onNotification);

      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [scope, locationId, scheduleSync]);

  // Reconcile missed events and read changes from other sessions.
  useEffect(() => {
    if (!locationId) return;

    const onFocus = () => scheduleSync();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        scheduleSync();
      }
    };

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        scheduleSync();
      }
    }, 60000);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener(
        "visibilitychange",
        onVisibility,
      );
    };
  }, [locationId, scheduleSync]);

  const runReadAction = useCallback(
    async (
      id: string,
      action: () => Promise<unknown>,
    ): Promise<void> => {
      if (!locationId) {
        throw new Error("Notification location is unavailable.");
      }

      if (actionLock.current) {
        throw new Error("Another notification action is in progress.");
      }

      actionLock.current = true;
      setBusyId(id);
      setActionError("");

      try {
        await action();
      } catch (error) {
        if (mounted.current) {
          setActionError(
            error instanceof Error
              ? error.message
              : "Unable to update notifications.",
          );
        }

        throw error;
      } finally {
        actionLock.current = false;

        if (mounted.current) {
          setBusyId(null);
          scheduleSync();
        }
      }
    },
    [locationId, scheduleSync],
  );

  const markRead = useCallback(
    (id: string) =>
      runReadAction(id, () => markNotificationRead(id)),
    [runReadAction],
  );

  const markAllRead = useCallback(
    () =>
      runReadAction("all", () =>
        markAllNotificationsRead(scope, locationId),
      ),
    [runReadAction, scope, locationId],
  );

  return (
    <NotificationContext.Provider
      value={{
        scope,
        locationId,
        locationName,
        notificationsHref:
          scope === "WAREHOUSE"
            ? "/operations/notifications"
            : "/restaurant/notifications",
        preview,
        unreadCount,
        totalCount,
        loading,
        syncing,
        error,
        actionError,
        connected,
        lastUpdated,
        revision,
        busyId,
        refresh,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}