"use client";

import { CommunityFeed } from "@/components/community/CommunityFeed";

export default function CommunityPage() {
  return (
    <div className="max-w-[680px] mx-auto pb-16">
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">Community</h1>
        <p className="text-sm text-gray-500 mt-0.5">Believe together. Grow together.</p>
      </div>

      {/* Thin separator */}
      <div className="border-t border-gray-200" />

      {/* Feed (composer + posts) */}
      <CommunityFeed />
    </div>
  );
}
