"use client";

import { useState } from "react";
import { Upload, Sparkles } from "lucide-react";
import { mockUser, mockDreamDeclaration, mockVisionImages } from "@/lib/mock-data";
import StreakCard from "@/components/dashboard/StreakCard";
import MembershipCard from "@/components/dashboard/MembershipCard";
import ZoomCard from "@/components/dashboard/ZoomCard";
import DreamDeclaration from "@/components/dashboard/DreamDeclaration";
import VisionGrid from "@/components/dashboard/VisionGrid";
import NotesPreview from "@/components/dashboard/NotesPreview";

export default function DashboardPage() {
  const [visionPrompt, setVisionPrompt] = useState("");
  const [declaration, setDeclaration] = useState(mockDreamDeclaration);
  const [generating, setGenerating] = useState(false);

  void mockVisionImages;

  const handleGenerate = () => {
    if (!visionPrompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setVisionPrompt("");
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Welcome Card */}
        <div className="sm:col-span-2 xl:col-span-1 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shrink-0">
              <img
                src={mockUser.avatar}
                alt={mockUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-xl font-bold">{mockUser.name}</p>
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
            <button className="inline-flex items-center gap-1.5 border border-gray-200 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Upload size={14} />
              Upload Image
            </button>
            <button className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors">
              <Sparkles size={14} />
              Generate Image
            </button>
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
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 bg-white"
          />
          <button
            onClick={handleGenerate}
            disabled={generating || !visionPrompt.trim()}
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-5 py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Sparkles size={14} />
            {generating ? "Generating..." : "Generate Image"}
          </button>
        </div>

        {/* Dream Declaration */}
        <DreamDeclaration
          declaration={declaration}
          onSave={setDeclaration}
        />

        {/* Vision Grid */}
        <div className="mt-6">
          <VisionGrid />
        </div>
      </section>

      {/* Notes Preview */}
      <section>
        <NotesPreview />
      </section>
    </div>
  );
}
