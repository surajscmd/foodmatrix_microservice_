import type {
  NotificationItem,
  NotificationListResponse,
  NotificationQuery,
  NotificationRequestOptions,
  NotificationScope,
} from "@/utils/types/notification";

export type * from "@/utils/types/notification";

const API_BASE = "/api/notification/notifications";

export class NotificationApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NotificationApiError";
    this.status = status;
  }
}

function segment(value: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("A required notification ID is missing.");
  }

  return encodeURIComponent(value.trim());
}

function scopePath(scope: NotificationScope): string {
  return scope === "WAREHOUSE" ? "warehouse" : "restaurant";
}

function queryString(query: NotificationQuery): string {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    limit: String(query.limit ?? 10),
  });

  if (query.isRead !== undefined) {
    params.set("isRead", String(query.isRead));
  }
  if (query.priority) params.set("priority", query.priority);
  if (query.search?.trim()) params.set("search", query.search.trim());

  return `?${params.toString()}`;
}

function errorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload
  ) {
    if (typeof payload.message === "string") {
      return payload.message;
    }

    if (Array.isArray(payload.message)) {
      const messages = payload.message.filter(
        (value): value is string => typeof value === "string",
      );

      if (messages.length) return messages.join(", ");
    }
  }

  return `Notification request failed (${status})`;
}

async function request<T>(
  path: string,
  method: "GET" | "PATCH" = "GET",
  options: NotificationRequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    signal: options.signal,
    headers: {
      Accept: "application/json",
    },
  });

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      throw new NotificationApiError(
        response.ok
          ? "Notification Service returned invalid JSON."
          : `Notification request failed (${response.status})`,
        response.status,
      );
    }
  }

  if (!response.ok) {
    throw new NotificationApiError(
      errorMessage(payload, response.status),
      response.status,
    );
  }

  if (payload === null) {
    throw new NotificationApiError(
      "Notification Service returned an empty response.",
      response.status,
    );
  }

  return payload as T;
}

export async function getNotifications(
  scope: NotificationScope,
  locationId: string,
  query: NotificationQuery = {},
  options?: NotificationRequestOptions,
): Promise<NotificationListResponse> {
  const response = await request<NotificationListResponse>(
    `/${scopePath(scope)}/${segment(locationId)}` +
      queryString(query),
    "GET",
    options,
  );

  if (
    !Array.isArray(response.data) ||
    !response.pagination ||
    !Number.isInteger(response.pagination.total) ||
    !Number.isInteger(response.pagination.totalPages)
  ) {
    throw new Error("Invalid notification list response.");
  }

  return response;
}

export async function getUnreadNotificationCount(
  scope: NotificationScope,
  locationId: string,
  options?: NotificationRequestOptions,
): Promise<number> {
  const response = await getNotifications(
    scope,
    locationId,
    {
      page: 1,
      limit: 1,
      isRead: false,
    },
    options,
  );

  return response.pagination.total;
}

export async function getNotification(
  notificationId: string,
  options?: NotificationRequestOptions,
): Promise<NotificationItem> {
  const response = await request<{
    message: string;
    data: NotificationItem;
  }>(
    `/${segment(notificationId)}`,
    "GET",
    options,
  );

  return response.data;
}

export async function markNotificationRead(
  notificationId: string,
): Promise<NotificationItem | null> {
  const response = await request<{
    message: string;
    data?: NotificationItem;
  }>(
    `/${segment(notificationId)}/read`,
    "PATCH",
  );

  return response.data ?? null;
}

export async function markAllNotificationsRead(
  scope: NotificationScope,
  locationId: string,
): Promise<number> {
  const response = await request<{
    message: string;
    data: {
      updatedCount: number;
    };
  }>(
    `/${scopePath(scope)}/${segment(locationId)}/read-all`,
    "PATCH",
  );

  return response.data.updatedCount;
}
