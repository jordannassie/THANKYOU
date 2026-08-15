"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Image,
  BookOpen,
  Users,
  User,
  LogOut,
} from "lucide-react";
import { signOut } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/vision-board", label: "Vision Board", icon: Image },
  { href: "/dashboard/notes", label: "Notes", icon: BookOpen },
  { href: "/dashboard/community", label: "Community", icon: Users },
  { href: "/dashboard/account", label: "Account", icon: User },
];

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-black text-white flex flex-col z-30">
      {/* Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">Thank You.</h1>
        <p className="text-xs text-white/50 mt-1 tracking-wide">See it. Believe it. Receive it.</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white text-black"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Scripture */}
      <div className="px-5 py-5 border-t border-white/10">
        <blockquote className="text-xs text-white/40 leading-relaxed italic">
          &ldquo;Commit to the Lord whatever you do, and He will establish your plans.&rdquo;
        </blockquote>
        <p className="text-xs text-white/30 mt-1">— Proverbs 16:3</p>
      </div>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all duration-150"
        >
          <LogOut size={17} />
          Log Out
        </button>
      </div>
    </aside>
  );
}
