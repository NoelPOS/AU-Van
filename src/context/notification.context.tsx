"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useSSE } from "@/hooks/use-sse";
import type { INotification } from "@/types";

interface NotificationContextType {
  notifications: INotification[];
  unreadCount: number;
  loading: boolean;
  markAllLoading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  markAllLoading: false,
  refresh: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteNotification: async () => {},
});

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50");
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // SSE real-time notifications
  useSSE(
    "/api/notifications/sse",
    {
      notification: (data: unknown) => {
        const notif = data as INotification;
        setNotifications((prev) => [notif, ...prev]);
        setUnreadCount((prev) => prev + 1);
      },
    },
    !!session?.user
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PUT" });
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (markAllLoading) return;

    const snapshotNotifications = notifications;
    const snapshotUnreadCount = unreadCount;

    setMarkAllLoading(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      const res = await fetch("/api/notifications", { method: "PUT" });
      if (!res.ok) throw new Error("Failed to mark all notifications as read");
    } catch {
      setNotifications(snapshotNotifications);
      setUnreadCount(snapshotUnreadCount);
    } finally {
      setMarkAllLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAllLoading,
        refresh: fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
