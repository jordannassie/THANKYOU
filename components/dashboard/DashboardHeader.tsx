"use client";

import { Bell } from "lucide-react";
import { mockUser } from "@/lib/mock-data";

export default function DashboardHeader() {
  return (
    <header className="fixed top-0 right-0 left-64 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-8 py-4 flex items-center justify-end gap-4">
      <button
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors relative"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-gray-600" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black rounded-full" />
      </button>
      <div
        className="w-9 h-9 rounded-full overflow-hidden border-2 border-gray-200 cursor-pointer"
        title={mockUser.name}
      >
        <img
          src={mockUser.avatar}
          alt={mockUser.name}
          className="w-full h-full object-cover"
        />
      </div>
    </header>
  );
}
