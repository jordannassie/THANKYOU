import { createClient } from "@/lib/supabase/server";
import AdminUsersClient from "./AdminUsersClient";
import type { Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
          Failed to load users: {error.message}
        </p>
      </div>
    );
  }

  return <AdminUsersClient users={(data ?? []) as Profile[]} />;
}
