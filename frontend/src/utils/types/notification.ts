export type NotificationScope =
  | "WAREHOUSE"
  | "RESTAURANT";

export type NotificationPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "CRITICAL";

export type NotificationType =
  | "SYSTEM"
  | "LOW_STOCK"
  | "STOCK_REQUEST_CREATED"
  | "STOCK_REQUEST_APPROVED"
  | "STOCK_SHIPPED"
  | "STOCK_RECEIVED"
  | "ORDER"
  | "EMPLOYEE_SIGNED_IN"
  | "EMPLOYEE_LATE"
  | "EMPLOYEE_CLOCKED_OUT_EARLY"
  | "LEAVE_APPLIED"
  | "ALERT";

export interface NotificationItem {
  id: string;
  scope: NotificationScope;

  restaurantId: string | null;
  warehouseId: string | null;

  type: NotificationType;
  priority: NotificationPriority;

  title: string;
  message: string;

  referenceId: string | null;
  referenceType: string | null;

  isRead: boolean;
  readAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface NotificationPaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationListResponse {
  message: string;
  data: NotificationItem[];
  pagination: NotificationPaginationData;
}

export interface NotificationQuery {
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export interface NotificationRequestOptions {
  signal?: AbortSignal;
}