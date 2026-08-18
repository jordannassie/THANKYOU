"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { getInitials } from "@/lib/types";

export default function DashboardHeader() {
  const { user, profile } = useUser();
  const initials = getInitials(profile, user?.email);
  const avatarUrl = profile?.avatar_url;
  const displayName = profile?.full_name ?? user?.email ?? "User";

  return (
    <header className="fixed top-0 right-0 left-64 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-end gap-4">
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-600" />
      </button>
      <Link
        href="/dashboard/account"
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600"
        title={displayName}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </Link>
    </header>
  );
}
