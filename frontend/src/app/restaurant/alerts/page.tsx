"use client";

import NotificationsScreen from "@/components/system/NotificationsScreen";
import { useState } from "react";


type NotificationType = "alert" | "warning" | "success" | "info";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: NotificationType;
  priority: Priority;
  read: boolean;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "NTF-1001",
      title: "Low Inventory",
      message: "Cheese stock has dropped below the minimum threshold.",
      time: "5 mins ago",
      type: "warning",
      priority: "High",
      read: false,
    },
    {
      id: "NTF-1002",
      title: "Kitchen Queue Normal",
      message: "Kitchen backlog has returned to normal operating levels.",
      time: "18 mins ago",
      type: "success",
      priority: "Low",
      read: false,
    },
    {
      id: "NTF-1003",
      title: "POS Offline",
      message: "Counter 2 POS terminal disconnected unexpectedly.",
      time: "32 mins ago",
      type: "alert",
      priority: "Critical",
      read: false,
    },
    {
      id: "NTF-1004",
      title: "Daily Backup Complete",
      message: "Restaurant database backup finished successfully.",
      time: "Today • 02:15 AM",
      type: "info",
      priority: "Low",
      read: true,
    },
  ]);

  const [searchTerm] = useState("");

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, read: true } : item
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <NotificationsScreen
      notifications={notifications}
      onMarkRead={markRead}
      onClearAll={clearAll}
      searchTerm={searchTerm}
    />
  );
}