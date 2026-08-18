"use client";

import { CommunityFeed } from "@/components/community/CommunityFeed";

export default function CommunityPage() {
  return (
    <div className="max-w-[680px] mx-auto">
      {/* Header */}
      <div className="px-4 pt-2 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold tracking-tight">Community</h1>
        <p className="text-sm text-gray-500 mt-0.5">Believe together. Grow together.</p>
      </div>

      {/* Feed */}
      <CommunityFeed />
    </div>
  );
}
