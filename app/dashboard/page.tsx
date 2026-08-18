"use client";

import { useState } from "react";
import { Upload, Sparkles, Loader2 } from "lucide-react";
import { mockDreamDeclaration } from "@/lib/mock-data";
import { useUser } from "@/components/providers/UserProvider";
import { getFirstName, getInitials } from "@/lib/types";
import StreakCard from "@/components/dashboard/StreakCard";
import MembershipCard from "@/components/dashboard/MembershipCard";
import ZoomCard from "@/components/dashboard/ZoomCard";
import DreamDeclaration from "@/components/dashboard/DreamDeclaration";
import VisionGrid from "@/components/dashboard/VisionGrid";
import NotesPreview from "@/components/dashboard/NotesPreview";

export default function DashboardPage() {
  const { user, profile } = useUser();
  const firstName = getFirstName(profile, user?.email);
  const initials = getInitials(profile, user?.email);
  const avatarUrl = profile?.avatar_url;

  const [visionPrompt, setVisionPrompt] = useState("");
  const [declaration, setDeclaration] = useState(mockDreamDeclaration);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [gridRefreshKey, setGridRefreshKey] = useState(0);

  const handleGenerate = async () => {
    if (!visionPrompt.trim() || generating) return;
    setGenerating(true);
    setGenerateError("");

    try {
      const res = await fetch("/api/vision/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: visionPrompt.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        setGenerateError(json.error ?? "We couldn't create that image. Please try again.");
      } else {
        setVisionPrompt("");
        // Increment key so VisionGrid re-fetches
        setGridRefreshKey((k) => k + 1);
      }
    } catch {
      setGenerateError("We couldn't create that image. Please try again.");
    }

    setGenerating(false);
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
        <div className="flex gap-2 mb-6">
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
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl mb-4">
            {generateError}
          </p>
        )}

        {generating && (
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-xl mb-4">
            <Loader2 size={15} className="animate-spin shrink-0" />
            Creating your vision… this may take 20–40 seconds.
          </div>
        )}

        {/* Dream Declaration */}
        <DreamDeclaration declaration={declaration} onSave={setDeclaration} />

        {/* Vision Grid — shows real user images */}
        <div className="mt-6">
          <VisionGrid refreshKey={gridRefreshKey} />
        </div>
      </section>

      {/* Notes Preview */}
      <section>
        <NotesPreview />
      </section>
    </div>
  );
}
