"use client";

import { useNotifications } from "@/context/notification.context";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, Trash2, X } from "lucide-react";

export function NotificationList({ onClose }: { onClose?: () => void }) {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } =
    useNotifications();

  return (
    <div className="flex max-h-[400px] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="font-semibold">Notifications</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllAsRead}
            className="text-xs text-blue-600 hover:underline"
            title="Mark all as read"
          >
            <CheckCheck className="h-4 w-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && notifications.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">Loading...</p>
        )}

        {!loading && notifications.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-500">No notifications</p>
        )}

        {notifications.map((notif) => (
          <div
            key={notif._id}
            className={`flex items-start gap-3 border-b px-4 py-3 transition-colors ${
              notif.read ? "bg-white" : "bg-blue-50"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {notif.title}
              </p>
              <p className="text-xs text-gray-600 line-clamp-2">{notif.message}</p>
              <p className="mt-1 text-[10px] text-gray-400">
                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
              </p>
            </div>
            <div className="flex gap-1">
              {!notif.read && (
                <button
                  onClick={() => markAsRead(notif._id)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </button>
              )}
              <button
                onClick={() => deleteNotification(notif._id)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
