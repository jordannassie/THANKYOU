"use client";

import { useState, useEffect, useMemo } from "react";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { mockDreamDeclaration } from "@/lib/mock-data";
import { useUser } from "@/components/providers/UserProvider";
import { getFirstName, getInitials } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import StreakCard from "@/components/dashboard/StreakCard";
import MembershipCard from "@/components/dashboard/MembershipCard";
import ZoomCard from "@/components/dashboard/ZoomCard";
import DreamDeclaration from "@/components/dashboard/DreamDeclaration";
import VisionGrid from "@/components/dashboard/VisionGrid";
import NotesPreview from "@/components/dashboard/NotesPreview";
import VisionLoadingBar from "@/components/dashboard/VisionLoadingBar";


export default function DashboardPage() {
  const { user, profile } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const firstName = getFirstName(profile, user?.email);
  const initials = getInitials(profile, user?.email);
  const avatarUrl = profile?.avatar_url;

  const [visionPrompt, setVisionPrompt] = useState("");
  const [declaration, setDeclaration] = useState(mockDreamDeclaration);

  // Load persisted declaration from localStorage once user is known
  useEffect(() => {
    if (!user?.id) return;
    const saved = localStorage.getItem(`ty-dream-${user.id}`);
    if (saved) setDeclaration(saved);
  }, [user?.id]);

  const handleSaveDeclaration = (value: string) => {
    setDeclaration(value);
    if (user?.id) {
      localStorage.setItem(`ty-dream-${user.id}`, value);
    }
  };
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [gridRefreshKey, setGridRefreshKey] = useState(0);
  const [pollingJobId, setPollingJobId] = useState<string | null>(null);

  // ── Poll for job completion ─────────────────────────────────────────
  useEffect(() => {
    if (!pollingJobId || !generating) return;

    let stopped     = false;
    let notFoundCount = 0;
    const POLL_TIMEOUT = 5 * 60 * 1000;
    const startedAt    = Date.now();

    const poll = async () => {
      if (stopped) return;

      if (Date.now() - startedAt > POLL_TIMEOUT) {
        stopped = true;
        setGenerateError("Generation timed out after 5 minutes. Please try again.");
        setGenerating(false);
        setPollingJobId(null);
        return;
      }

      try {
        const res = await fetch(`/api/vision/job/${pollingJobId}`);

        if (res.status === 404) {
          notFoundCount++;
          if (notFoundCount >= 4) {
            stopped = true;
            setGenerateError(
              "Job not found. Please run the SQL migration (004_vision_jobs.sql) in Supabase and try again."
            );
            setGenerating(false);
            setPollingJobId(null);
            return;
          }
          setTimeout(poll, 3000);
          return;
        }

        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string };
          stopped = true;
          setGenerateError(json.error ?? `Server error (${res.status}).`);
          setGenerating(false);
          setPollingJobId(null);
          return;
        }

        const job = await res.json() as { status: string; error_message?: string | null };

        if (job.status === "completed") {
          stopped = true;
          setGridRefreshKey((k) => k + 1);
          setVisionPrompt("");
          setGenerating(false);
          setPollingJobId(null);
        } else if (job.status === "failed") {
          stopped = true;
          setGenerateError(job.error_message ?? "Generation failed. Please try again.");
          setGenerating(false);
          setPollingJobId(null);
        } else {
          setTimeout(poll, 4000);
        }
      } catch {
        if (!stopped) setTimeout(poll, 5000);
      }
    };

    const timer = setTimeout(poll, 2000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [pollingJobId, generating]);

  const handleGenerate = async () => {
    if (!visionPrompt.trim() || generating || !user) return;
    setGenerating(true);
    setGenerateError("");

    try {
      // Step 1: create job record in DB (~200 ms)
      const startRes = await fetch("/api/vision/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: visionPrompt.trim() }),
      });

      const startJson = await startRes.json() as {
        jobId?: string;
        accessToken?: string;
        error?: string;
      };

      if (!startRes.ok || !startJson.jobId) {
        setGenerateError(startJson.error ?? `Server error (${startRes.status}). Please try again.`);
        setGenerating(false);
        return;
      }

      const { jobId, accessToken } = startJson;

      // Step 2: fire background function (fire-and-forget)
      fetch("/.netlify/functions/vision-generate-background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken ?? ""}`,
        },
        body: JSON.stringify({ jobId, prompt: visionPrompt.trim() }),
      }).catch(() => {});

      // Step 3: start polling
      setPollingJobId(jobId);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Network error — please try again.");
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Welcome Card */}
        <div className="sm:col-span-2 xl:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-lg">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-xl font-bold">{firstName}</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            See the future you are believing God for.
          </p>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-500">Nothing is impossible with God.</p>
            <p className="text-sm font-semibold mt-0.5">What a man believes, he becomes.</p>
          </div>
        </div>

        <StreakCard />
        <MembershipCard />
        <ZoomCard />
      </div>

      {/* Dream Declaration — sits above vision tools */}
      <DreamDeclaration declaration={declaration} onSave={handleSaveDeclaration} />

      {/* My Vision Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">My Vision</h2>
            <p className="text-sm text-gray-500">
              Visualize. Believe. Act. Watch God bring it to pass.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/dashboard/vision-board"
              className="inline-flex items-center gap-1.5 border border-gray-200 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Upload size={14} />
              Upload Image
            </a>
          </div>
        </div>

        {/* Vision Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={visionPrompt}
            onChange={(e) => setVisionPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="Describe the vision you are believing God for..."
            disabled={generating}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 bg-white disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !visionPrompt.trim()}
            className="inline-flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={generating ? {
              background: "linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4, #7c3aed)",
              backgroundSize: "300% 100%",
              animation: "vb-sweep 2.4s linear infinite",
            } : { background: "#000" }}
          >
            {generating ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generating ? "Generating…" : "Generate Image"}
          </button>
        </div>

        {generateError && (
          <div className="bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-4">
            <p className="text-sm text-red-600">{generateError}</p>
            <button
              onClick={() => setGenerateError("")}
              className="mt-1 text-xs text-red-500 underline"
            >
              Dismiss and try again
            </button>
          </div>
        )}

        {generating && <VisionLoadingBar />}

        {/* Vision Grid — shows real user images */}
        <VisionGrid refreshKey={gridRefreshKey} />
      </section>

      {/* Notes Preview */}
      <section>
        <NotesPreview />
      </section>
    </div>
  );
}
