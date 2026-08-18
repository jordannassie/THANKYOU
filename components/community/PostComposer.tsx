"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { MiniProfile } from "@/lib/types/community";
import { AvatarBubble } from "./AvatarBubble";

interface Props {
  profile: MiniProfile | null;
  onPost: (content: string) => Promise<string | null>;
}

export function PostComposer({ profile, onPost }: Props) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = 1000 - text.length;
  const canPost = text.trim().length > 0 && !posting;

  const handlePost = async () => {
    if (!canPost) return;
    setPosting(true);
    setError(null);
    const err = await onPost(text.trim());
    if (err) {
      setError(err);
    } else {
      setText("");
    }
    setPosting(false);
  };

  return (
    <div className="mx-4 my-4">
      {/* Card */}
      <div className="border border-gray-200 rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <AvatarBubble profile={profile} size="md" />

          <div className="flex-1 min-w-0">
            {/* Visible textarea */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handlePost();
              }}
              placeholder="What are you thankful for today?"
              maxLength={1000}
              rows={3}
              disabled={posting}
              className="
                w-full min-h-[90px] px-3 py-2.5 text-sm text-gray-900
                bg-white border border-gray-300 rounded-xl resize-none
                placeholder:text-gray-400
                focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400
                disabled:opacity-60 leading-relaxed
              "
            />

            {error && (
              <p className="text-xs text-red-500 mt-2">{error}</p>
            )}

            {/* Footer row */}
            <div className="flex items-center justify-between mt-3">
              <span
                className={`text-xs tabular-nums ${
                  remaining < 20
                    ? "text-red-500 font-medium"
                    : remaining < 100
                    ? "text-amber-500"
                    : "text-transparent select-none"
                }`}
              >
                {remaining} left
              </span>

              <button
                onClick={handlePost}
                disabled={!canPost}
                className="
                  inline-flex items-center gap-1.5
                  bg-black text-white text-sm font-semibold
                  px-6 py-2 rounded-full
                  hover:bg-gray-800 active:bg-gray-900
                  transition-colors
                  disabled:bg-gray-300 disabled:cursor-not-allowed
                "
              >
                {posting && <Loader2 size={13} className="animate-spin" />}
                {posting ? "Posting…" : "Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
