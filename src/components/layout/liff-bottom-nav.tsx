"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Bell, BookOpen, User } from "lucide-react";
import { useNotifications } from "@/context/notification.context";

const navItems = [
  { href: "/", label: "Home", icon: Home, match: "/" },
  { href: "/mybookings", label: "My Bookings", icon: BookOpen, match: "/mybookings" },
  { href: "/notifications", label: "Notifications", icon: Bell, match: "/notifications" },
  { href: "/profile", label: "Profile", icon: User, match: "/profile" },
];

export function LiffBottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();

  if (!session?.user) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 border-t border-[#d8dcef] bg-[#3f53c9] px-2 pb-2 pt-1.5 shadow-[0_-8px_30px_rgba(20,38,120,0.2)]">
      <ul className="grid grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.match ||
            (item.match !== "/" && pathname.startsWith(item.match));

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`relative flex flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] transition-colors ${
                  active ? "text-white" : "text-white/70 hover:text-white/90"
                }`}
              >
                <div className="relative">
                  <Icon className="h-3.5 w-3.5" />
                  {item.href === "/notifications" && unreadCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#ffda5e] px-1 text-[8px] font-bold text-[#1f2f8d]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="leading-none">{item.label}</span>
                {active && <span className="mt-0.5 h-0.5 w-6 rounded-full bg-white" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
