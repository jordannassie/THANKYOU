"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  BookOpen,
  Users,
  User,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/vision-board", label: "Vision", icon: Image },
  { href: "/dashboard/notes", label: "Notes", icon: BookOpen },
  { href: "/dashboard/community", label: "Community", icon: Users },
  { href: "/dashboard/account", label: "Account", icon: User },
];

export default function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 md:hidden safe-area-pb">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-150 min-w-0 ${
                isActive ? "text-black" : "text-gray-400"
              }`}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
