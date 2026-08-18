"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { MiniProfile } from "@/lib/types/community";
import { AvatarBubble } from "./AvatarBubble";

interface Props {
  profile: MiniProfile | null;
  placeholder?: string;
  onSubmit: (content: string) => Promise<string | null>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function ReplyComposer({
  profile,
  placeholder = "Write a reply…",
  onSubmit,
  onCancel,
  autoFocus,
}: Props) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = 500 - text.length;
  const canSubmit = text.trim().length > 0 && !submitting;

  const handle = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    const err = await onSubmit(text.trim());
    if (err) {
      setError(err);
    } else {
      setText("");
      onCancel?.();
    }
    setSubmitting(false);
  };

  return (
    <div className="flex gap-2 mt-2">
      <AvatarBubble profile={profile} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="border border-gray-200 rounded-xl bg-gray-50 px-3 py-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handle();
              if (e.key === "Escape") onCancel?.();
            }}
            placeholder={placeholder}
            maxLength={500}
            rows={2}
            autoFocus={autoFocus}
            disabled={submitting}
            className="w-full text-xs bg-transparent resize-none focus:outline-none placeholder:text-gray-400 leading-relaxed"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[10px] ${remaining < 100 ? "text-amber-500" : "text-gray-300"}`}>
              {remaining < 200 ? `${remaining} left` : ""}
            </span>
            <div className="flex gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handle}
                disabled={!canSubmit}
                className="inline-flex items-center gap-1 bg-black text-white text-xs font-medium px-3 py-1 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting && <Loader2 size={10} className="animate-spin" />}
                Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
