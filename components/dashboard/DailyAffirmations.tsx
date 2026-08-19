"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/UserProvider";
import { DEFAULT_AFFIRMATIONS, PREVIEW_COUNT } from "@/lib/affirmations/defaults";
import type { Affirmation } from "@/lib/affirmations/types";
import { localTodayStr } from "@/lib/affirmations/types";
import AffirmationListItem from "./affirmations/AffirmationListItem";
import AffirmationsViewAllModal from "./affirmations/AffirmationsViewAllModal";
import AffirmationsEditorModal from "./affirmations/AffirmationsEditorModal";

function demoCompletedToday(today: string): boolean {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(`ty-affirmations-done-${today}`) === "1" ||
    localStorage.getItem(`ty-confessions-done-${today}`) === "1"
  );
}

export default function DailyAffirmations() {
  const { user, isDemo } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [affirmations, setAffirmations] = useState<Affirmation[]>(DEFAULT_AFFIRMATIONS);
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
      setAffirmations(DEFAULT_AFFIRMATIONS);
      setCompletedToday(demoCompletedToday(today));
      setLoading(false);
      return;
    }

    if (!user?.id) {
      setLoading(false);
      return;
    }

    const [affRes, doneRes] = await Promise.all([
      supabase
        .from("user_affirmations")
        .select("id, affirmation_text, scripture_reference, sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("affirmation_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("completion_date", today)
        .maybeSingle(),
    ]);

    // Fallback: legacy table names if migration 011 not yet applied
    let rows = (affRes.data ?? []) as Affirmation[];
    if (affRes.error && affRes.error.message.includes("does not exist")) {
      const legacy = await supabase
        .from("user_confessions")
        .select("id, confession_text, scripture_reference, sort_order")
        .eq("user_id", user.id)
        .order("sort_order", { ascending: true });
      rows = ((legacy.data ?? []) as Array<{
        id: string;
        confession_text: string;
        scripture_reference: string;
        sort_order: number;
      }>).map((r) => ({
        id: r.id,
        affirmation_text: r.confession_text,
        scripture_reference: r.scripture_reference,
        sort_order: r.sort_order,
      }));
    }

    let done = doneRes.data;
    if (doneRes.error && doneRes.error.message.includes("does not exist")) {
      const legacyDone = await supabase
        .from("confession_completions")
        .select("id")
        .eq("user_id", user.id)
        .eq("completion_date", today)
        .maybeSingle();
      done = legacyDone.data;
    }

    if (rows.length > 0) {
      setAffirmations(rows);
    } else {
      setAffirmations(DEFAULT_AFFIRMATIONS);
    }

    setCompletedToday(!!done);
    setLoading(false);
  }, [isDemo, user?.id, supabase, today]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const markAffirmationsComplete = async () => {
    if (completedToday || completing) return;

    setCompleting(true);
    setSuccessMsg("");

    if (isDemo) {
      localStorage.setItem(`ty-affirmations-done-${today}`, "1");
      setCompletedToday(true);
      setSuccessMsg("Affirmations marked complete for today.");
      setCompleting(false);
      return;
    }

    if (!user?.id) {
      setCompleting(false);
      return;
    }

    let { error } = await supabase.from("affirmation_completions").insert({
      user_id: user.id,
      completion_date: today,
    });

    if (error?.message.includes("does not exist")) {
      const legacy = await supabase.from("confession_completions").insert({
        user_id: user.id,
        completion_date: today,
      });
      error = legacy.error;
    }

    if (error && error.code !== "23505") {
      console.error("[affirmations] complete error:", error);
      setCompleting(false);
      return;
    }

    setCompletedToday(true);
    setSuccessMsg("Affirmations marked complete for today.");
    setCompleting(false);

    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fetch("/api/streak/checkin", {
        method: "POST",
        headers: { "x-timezone": tz },
      }).catch(() => {});
    } catch { /* non-fatal */ }
  };

  const handleSaveAffirmations = async (items: Affirmation[]) => {
    setSaving(true);

    if (isDemo) {
      setAffirmations(items.length > 0 ? items : DEFAULT_AFFIRMATIONS);
      setSaving(false);
      setShowEditor(false);
      return;
    }

    if (!user?.id) {
      setSaving(false);
      return;
    }

    const table = "user_affirmations";
    const textField = "affirmation_text";

    let deleteErr = (await supabase.from(table).delete().eq("user_id", user.id)).error;
    if (deleteErr?.message.includes("does not exist")) {
      await supabase.from("user_confessions").delete().eq("user_id", user.id);
    }

    if (items.length > 0) {
      const payload = items.map((item, index) => ({
        user_id: user.id,
        [textField]: item.affirmation_text.trim(),
        scripture_reference: item.scripture_reference.trim(),
        sort_order: index,
      }));

      let { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select("id, affirmation_text, scripture_reference, sort_order");

      if (error?.message.includes("does not exist")) {
        const legacyPayload = items.map((item, index) => ({
          user_id: user.id,
          confession_text: item.affirmation_text.trim(),
          scripture_reference: item.scripture_reference.trim(),
          sort_order: index,
        }));
        const legacy = await supabase
          .from("user_confessions")
          .insert(legacyPayload)
          .select("id, confession_text, scripture_reference, sort_order");
        error = legacy.error;
        data = (legacy.data ?? []).map((r: {
          id: string;
          confession_text: string;
          scripture_reference: string;
          sort_order: number;
        }) => ({
          id: r.id,
          affirmation_text: r.confession_text,
          scripture_reference: r.scripture_reference,
          sort_order: r.sort_order,
        })) as typeof data;
      }

      if (error) {
        console.error("[affirmations] save error:", error);
        setSaving(false);
        return;
      }

      setAffirmations((data as Affirmation[]) ?? items);
    } else {
      setAffirmations(DEFAULT_AFFIRMATIONS);
    }

    setSaving(false);
    setShowEditor(false);
  };

  const handleReset = async () => {
    if (isDemo) {
      setAffirmations(DEFAULT_AFFIRMATIONS);
      return;
    }

    if (!user?.id) return;

    const { error } = await supabase.from("user_affirmations").delete().eq("user_id", user.id);
    if (error?.message.includes("does not exist")) {
      await supabase.from("user_confessions").delete().eq("user_id", user.id);
    }
    setAffirmations(DEFAULT_AFFIRMATIONS);
  };

  const preview = affirmations.slice(0, PREVIEW_COUNT);
  const total = affirmations.length;

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold">Daily Affirmations</h2>
            <p className="text-sm text-gray-500">
              Speak God&apos;s Word over your life today.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowViewAll(true)}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-black transition-colors shrink-0"
            aria-label={`View all ${total} affirmations`}
          >
            View All {total}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="px-6 divide-y divide-gray-100">
          {preview.map((a) => (
            <AffirmationListItem key={a.id} affirmation={a} />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowEditor(true)}
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors text-left"
          >
            Edit Affirmations
          </button>

          <button
            type="button"
            onClick={markAffirmationsComplete}
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
              ? "Affirmations Completed Today"
              : "I Spoke My Affirmations Today"}
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
        <AffirmationsViewAllModal
          affirmations={affirmations}
          completedToday={completedToday}
          completing={completing}
          onClose={() => setShowViewAll(false)}
          onComplete={markAffirmationsComplete}
          onEdit={() => {
            setShowViewAll(false);
            setShowEditor(true);
          }}
        />
      )}

      {showEditor && (
        <AffirmationsEditorModal
          initialAffirmations={affirmations}
          saving={saving}
          onClose={() => setShowEditor(false)}
          onSave={handleSaveAffirmations}
          onReset={handleReset}
        />
      )}
    </>
  );
}
