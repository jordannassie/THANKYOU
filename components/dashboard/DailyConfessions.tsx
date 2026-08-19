"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/UserProvider";
import { DEFAULT_CONFESSIONS, PREVIEW_COUNT } from "@/lib/confessions/defaults";
import type { Confession } from "@/lib/confessions/types";
import { localTodayStr } from "@/lib/confessions/types";
import ConfessionListItem from "./confessions/ConfessionListItem";
import ConfessionsViewAllModal from "./confessions/ConfessionsViewAllModal";
import ConfessionsEditorModal from "./confessions/ConfessionsEditorModal";

export default function DailyConfessions() {
  const { user, isDemo } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [confessions, setConfessions] = useState<Confession[]>(DEFAULT_CONFESSIONS);
  const [loading, setLoading] = useState(true);
  const [completedToday, setCompletedToday] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [showViewAll, setShowViewAll] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const today = localTodayStr();

  const loadData = useCallback(async () => {
    if (isDemo) {
      setConfessions(DEFAULT_CONFESSIONS);
      const demoDone = localStorage.getItem(`ty-confessions-done-${today}`) === "1";
      setCompletedToday(demoDone);
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setLoading(false);
      return;
    }

    const [confRes, doneRes] = await Promise.all([
      supabase
        .from("user_confessions")
        .select("id, confession_text, scripture_reference, sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("confession_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("completion_date", today)
        .maybeSingle(),
    ]);

    const rows = (confRes.data ?? []) as Confession[];
    if (rows.length > 0) {
      setConfessions(rows);
    } else {
      setConfessions(DEFAULT_CONFESSIONS);
    }

    setCompletedToday(!!doneRes.data);
    setLoading(false);
  }, [isDemo, user?.id, supabase, today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleComplete = async () => {
    if (completedToday || completing) return;

    setCompleting(true);
    setSuccessMsg("");

    if (isDemo) {
      localStorage.setItem(`ty-confessions-done-${today}`, "1");
      setCompletedToday(true);
      setSuccessMsg("Confessions marked complete for today.");
      setCompleting(false);
      return;
    }

    if (!user?.id) {
      setCompleting(false);
      return;
    }

    const { error } = await supabase.from("confession_completions").insert({
      user_id: user.id,
      completion_date: today,
    });

    if (error && error.code !== "23505") {
      console.error("[confessions] complete error:", error);
      setCompleting(false);
      return;
    }

    setCompletedToday(true);
    setSuccessMsg("Confessions marked complete for today.");
    setCompleting(false);

    // Also record daily check-in for streak (same dashboard visit pattern)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fetch("/api/streak/checkin", {
        method: "POST",
        headers: { "x-timezone": tz },
      }).catch(() => {});
    } catch { /* non-fatal */ }
  };

  const handleSaveConfessions = async (items: Confession[]) => {
    setSaving(true);

    if (isDemo) {
      setConfessions(items.length > 0 ? items : DEFAULT_CONFESSIONS);
      setSaving(false);
      setShowEditor(false);
      return;
    }

    if (!user?.id) {
      setSaving(false);
      return;
    }

    // Replace entire personalized list
    await supabase.from("user_confessions").delete().eq("user_id", user.id);

    if (items.length > 0) {
      const { data, error } = await supabase
        .from("user_confessions")
        .insert(
          items.map((item, index) => ({
            user_id: user.id,
            confession_text: item.confession_text.trim(),
            scripture_reference: item.scripture_reference.trim(),
            sort_order: index,
          }))
        )
        .select("id, confession_text, scripture_reference, sort_order");

      if (error) {
        console.error("[confessions] save error:", error);
        setSaving(false);
        return;
      }

      setConfessions((data as Confession[]) ?? items);
    } else {
      setConfessions(DEFAULT_CONFESSIONS);
    }

    setSaving(false);
    setShowEditor(false);
  };

  const handleReset = async () => {
    if (isDemo) {
      setConfessions(DEFAULT_CONFESSIONS);
      return;
    }

    if (!user?.id) return;

    await supabase.from("user_confessions").delete().eq("user_id", user.id);
    setConfessions(DEFAULT_CONFESSIONS);
  };

  const preview = confessions.slice(0, PREVIEW_COUNT);
  const total = confessions.length;

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 flex items-center justify-center text-gray-400">
        <Loader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold">Daily Confessions</h2>
            <p className="text-sm text-gray-500">
              Speak God&apos;s Word over your life today.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowViewAll(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black transition-colors shrink-0"
          >
            View All {total}
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Preview list */}
        <div className="px-6 divide-y divide-gray-100">
          {preview.map((c) => (
            <ConfessionListItem key={c.id} confession={c} />
          ))}
        </div>

        {/* Action bar */}
        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors text-left"
          >
            Edit Confessions
          </button>

          <button
            type="button"
            onClick={handleComplete}
            disabled={completedToday || completing}
            className={`inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors w-full sm:w-auto ${
              completedToday
                ? "bg-green-50 text-green-700 border border-green-200 cursor-default"
                : "bg-black text-white hover:bg-gray-900 disabled:opacity-50"
            }`}
          >
            <Check size={15} />
            {completing
              ? "Saving…"
              : completedToday
              ? "Confessions Completed Today"
              : "I Confessed These Today"}
          </button>
        </div>

        {successMsg && (
          <div className="px-6 pb-4">
            <p className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {successMsg}
            </p>
          </div>
        )}
      </div>

      {showViewAll && (
        <ConfessionsViewAllModal
          confessions={confessions}
          completedToday={completedToday}
          completing={completing}
          onClose={() => setShowViewAll(false)}
          onComplete={async () => {
            await handleComplete();
          }}
          onEdit={() => {
            setShowViewAll(false);
            setShowEditor(true);
          }}
        />
      )}

      {showEditor && (
        <ConfessionsEditorModal
          initialConfessions={confessions}
          saving={saving}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveConfessions}
          onReset={handleReset}
        />
      )}
    </>
  );
}
