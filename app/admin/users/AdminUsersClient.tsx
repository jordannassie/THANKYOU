"use client";

import { useState } from "react";
import { getInitials } from "@/lib/types";
import type { Profile } from "@/lib/types";
import { Loader2, Check, X } from "lucide-react";

interface Props {
  users: Profile[];
}

function Badge({ label, variant }: { label: string; variant: "black" | "gray" | "green" | "yellow" }) {
  const styles = {
    black: "bg-black text-white",
    gray: "bg-gray-100 text-gray-600",
    green: "bg-emerald-50 text-emerald-700",
    yellow: "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${styles[variant]}`}>
      {label}
    </span>
  );
}

export default function AdminUsersClient({ users: initialUsers }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ role: string; membership_status: string }>({
    role: "user",
    membership_status: "free",
  });

  const startEdit = (user: Profile) => {
    setEditing(user.id);
    setEditValues({ role: user.role, membership_status: user.membership_status });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async (userId: string) => {
    setSaving(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId
              ? { ...u, role: editValues.role as Profile["role"], membership_status: editValues.membership_status as Profile["membership_status"] }
              : u
          )
        );
        setEditing(null);
      }
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-gray-500 text-sm mt-1">{users.length} total users</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">User</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Role</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Membership</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500 text-xs">Joined</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500 text-xs">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => {
                const isEditing = editing === u.id;
                const isSaving = saving === u.id;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 shrink-0">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name ?? ""} className="w-full h-full object-cover" />
                          ) : (
                            getInitials(u, u.email)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.full_name || "—"}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={editValues.role}
                          onChange={(e) => setEditValues((v) => ({ ...v, role: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <Badge label={u.role} variant={u.role === "admin" ? "black" : "gray"} />
                      )}
                    </td>

                    {/* Membership */}
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <select
                          value={editValues.membership_status}
                          onChange={(e) => setEditValues((v) => ({ ...v, membership_status: e.target.value }))}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black/10"
                        >
                          <option value="free">free</option>
                          <option value="premium">premium</option>
                        </select>
                      ) : (
                        <Badge
                          label={u.membership_status}
                          variant={u.membership_status === "premium" ? "green" : "gray"}
                        />
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(u.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => saveEdit(u.id)}
                            disabled={isSaving}
                            className="w-7 h-7 bg-black text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="w-7 h-7 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(u)}
                          className="text-xs font-medium text-gray-500 hover:text-black transition-colors px-3 py-1 rounded-lg border border-gray-100 hover:border-gray-200"
                        >
                          Edit
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
