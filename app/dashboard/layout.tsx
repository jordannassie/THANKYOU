import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { UserProvider } from "@/components/providers/UserProvider";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileNavigation from "@/components/dashboard/MobileNavigation";
import MobileTopBar from "@/components/dashboard/MobileTopBar";
import type { Profile } from "@/lib/types";

const DEMO_PROFILE: Profile = {
  id: "demo-user",
  email: "demo@thankyou.app",
  full_name: "Jordan",
  avatar_url: null,
  role: "user",
  membership_status: "premium",
  invite_code: "demo1234",
  country_code: "US",
  dream_declaration: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for demo mode first
  const cookieStore = await cookies();
  const isDemoUser = cookieStore.get("ty_demo_user")?.value === "true";

  if (isDemoUser) {
    return (
      <UserProvider user={null} profile={DEMO_PROFILE} isDemo={true}>
        <div className="min-h-screen bg-gray-50">
          <div className="hidden md:block">
            <DashboardSidebar />
            <DashboardHeader />
          </div>
          <div className="md:hidden">
            <MobileTopBar />
          </div>
          <main className="md:pl-64 pt-0 md:pt-16 pb-24 md:pb-0">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">
              {children}
            </div>
          </main>
          <div className="md:hidden">
            <MobileNavigation />
          </div>
        </div>
      </UserProvider>
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware handles the redirect, but this is a safety net for server components.
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as Profile | null;

  return (
    <UserProvider user={user} profile={profile} isDemo={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop sidebar + header */}
        <div className="hidden md:block">
          <DashboardSidebar />
          <DashboardHeader />
        </div>

        {/* Mobile top bar */}
        <div className="md:hidden">
          <MobileTopBar />
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
    </UserProvider>
  );
}
