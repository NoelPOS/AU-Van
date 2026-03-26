"use client";

import { useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useNotifications } from "@/context/notification.context";
import { LiffPageLoading } from "@/components/shared/loading";
import { LiffPageHeader } from "@/components/layout/liff-page-header";

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

  const groups = useMemo(() => {
    const grouped = { today: [] as typeof notifications, yesterday: [] as typeof notifications, earlier: [] as typeof notifications };

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      if (isToday(date)) {
        grouped.today.push(notification);
      } else if (isYesterday(date)) {
        grouped.yesterday.push(notification);
      } else {
        grouped.earlier.push(notification);
      }
    });

    return grouped;
  }, [notifications]);

  return (
    <div className="px-4 pb-6 pt-3">
      <LiffPageHeader
        title="Notifications"
        subtitle="Updates for bookings and payments"
        rightSlot={
          <button
            onClick={markAllAsRead}
            className="rounded-md border border-[#ccd4f3] bg-white px-2 py-1 text-[11px] font-medium text-[#3f53c9]"
          >
            <span className="inline-flex items-center gap-1">
              <CheckCheck className="h-3 w-3" /> Read all
            </span>
          </button>
        }
      />

      {loading && notifications.length === 0 && (
        <LiffPageLoading title="Loading notifications" subtitle="Checking your latest updates..." />
      )}

      {!loading && notifications.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#cad2f1] bg-white px-4 py-10 text-center">
          <Bell className="mx-auto mb-2 h-6 w-6 text-[#9ca7d8]" />
          <p className="text-xs text-[#6470a8]">No notifications yet</p>
        </div>
      )}

      {groups.today.length > 0 && (
        <NotificationSection
          title="Today"
          items={groups.today}
          onRead={markAsRead}
        />
      )}

      {groups.yesterday.length > 0 && (
        <NotificationSection
          title="Yesterday"
          items={groups.yesterday}
          onRead={markAsRead}
        />
      )}

      {groups.earlier.length > 0 && (
        <NotificationSection
          title="Earlier"
          items={groups.earlier}
          onRead={markAsRead}
        />
      )}
    </div>
  );
}

function NotificationSection({
  title,
  items,
  onRead,
}: {
  title: string;
  items: Array<{
    _id: string;
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
  }>;
  onRead: (id: string) => Promise<void>;
}) {
  return (
    <section className="mb-4">
      <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#707db6]">
        {title}
      </h2>
      <div className="space-y-2">
        {items.map((notification) => (
          <article
            key={notification._id}
            className={`rounded-lg border px-3 py-2.5 ${
              notification.read
                ? "border-[#d7dcf4] bg-white"
                : "border-[#4f62d3] bg-[#5c6fd9] text-white shadow-sm"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={`text-[11px] font-semibold ${
                    notification.read ? "text-[#1f2f8d]" : "text-white"
                  }`}
                >
                  {notification.title}
                </p>
                <p
                  className={`mt-1 text-[10px] leading-relaxed ${
                    notification.read ? "text-[#6470a8]" : "text-white/85"
                  }`}
                >
                  {notification.message}
                </p>
                <p
                  className={`mt-1 text-[9px] ${
                    notification.read ? "text-[#91a0dd]" : "text-white/70"
                  }`}
                >
                  {format(new Date(notification.createdAt), "p")}
                </p>
              </div>

              {!notification.read && (
                <button
                  onClick={() => onRead(notification._id)}
                  className="rounded bg-white/20 p-1 text-white transition-colors hover:bg-white/30"
                  title="Mark as read"
                >
                  <Check className="h-3 w-3" />
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
