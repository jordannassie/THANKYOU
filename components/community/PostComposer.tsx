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
    <div className="flex gap-3 px-4 py-4 border-b border-gray-100">
      <AvatarBubble profile={profile} size="md" />
      <div className="flex-1 min-w-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter to post; plain Enter = newline
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handlePost();
          }}
          placeholder="What are you thankful for today?"
          maxLength={1000}
          rows={3}
          disabled={posting}
          className="w-full text-sm resize-none focus:outline-none placeholder:text-gray-400 disabled:opacity-60 leading-relaxed"
        />

        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <span className={`text-xs ${remaining < 100 ? (remaining < 20 ? "text-red-400 font-medium" : "text-amber-500") : "text-gray-300"}`}>
            {remaining < 200 ? `${remaining} left` : ""}
          </span>
          <button
            onClick={handlePost}
            disabled={!canPost}
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-5 py-1.5 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {posting && <Loader2 size={12} className="animate-spin" />}
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
