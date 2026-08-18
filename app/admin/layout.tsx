import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { LayoutDashboard, Users, LogOut } from "lucide-react";
import ExitAdminButton from "./ExitAdminButton";

const ADMIN_CODE = "1234";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check for staff access code first (bypasses Supabase auth)
  const cookieStore = await cookies();
  const adminCode = cookieStore.get("ty_admin_code")?.value;
  const hasAdminCode = adminCode === ADMIN_CODE;

  if (!hasAdminCode) {
    // Fall back to Supabase profile-based admin check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile = profileData as Profile | null;

    if (!profile || profile.role !== "admin") {
      redirect("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-56 bg-black text-white flex flex-col fixed top-0 left-0 h-full z-30">
        <div className="px-5 pt-7 pb-5 border-b border-white/10">
          <Link href="/dashboard" className="text-lg font-bold block">Thank You.</Link>
          <span className="text-[10px] text-white/40 tracking-widest uppercase">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-5 space-y-1">
          <AdminLink href="/admin" icon={<LayoutDashboard size={16} />} label="Overview" />
          <AdminLink href="/admin/users" icon={<Users size={16} />} label="Users" />
        </nav>
        <div className="px-3 pb-5 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <LogOut size={14} />
            Back to Dashboard
          </Link>
          <ExitAdminButton />
        </div>
      </aside>

      {/* Main */}
      <main className="pl-56 flex-1">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}


function AdminLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
