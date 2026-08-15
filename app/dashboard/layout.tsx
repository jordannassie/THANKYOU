"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileNavigation from "@/components/dashboard/MobileNavigation";
import { isAuthenticated } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <DashboardSidebar />
        <DashboardHeader />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden bg-black text-white px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Thank You.</h1>
          <p className="text-[10px] text-white/50 tracking-wide">See it. Believe it. Receive it.</p>
        </div>
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Main content */}
      <main className="md:pl-64 pt-0 md:pt-16 pb-24 md:pb-0">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <MobileNavigation />
      </div>
    </div>
  );
}
