import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Users, UserCheck, Crown, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

// Computed at request time (module top-level is re-evaluated per request in dynamic mode)
function daysAgoISO(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase.from("profiles").select("role, membership_status, created_at");

  const total = profiles?.length ?? 0;
  const admins = profiles?.filter((p) => p.role === "admin").length ?? 0;
  const premium = profiles?.filter((p) => p.membership_status === "premium").length ?? 0;

  // New in last 30 days
  const newUsers = profiles?.filter((p) => p.created_at >= daysAgoISO(30)).length ?? 0;

  const stats = [
    { label: "Total Users", value: total, icon: Users, href: "/admin/users" },
    { label: "New (30 days)", value: newUsers, icon: UserCheck, href: "/admin/users" },
    { label: "Premium Members", value: premium, icon: Crown, href: "/admin/users" },
    { label: "Admins", value: admins, icon: ShieldCheck, href: "/admin/users" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Thank You. platform at a glance.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                  <Icon size={15} className="text-white" />
                </div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/users"
            className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
          >
            Manage Users
          </Link>
          <Link
            href="/dashboard"
            className="border border-gray-200 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
