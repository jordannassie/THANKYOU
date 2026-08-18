"use client";

import { ThumbsUp, Heart, MessageCircle, Trash2 } from "lucide-react";
import type { CommunityReaction, ReactionType } from "@/lib/types/community";
import { countReactions, hasReacted } from "@/lib/types/community";

interface Props {
  reactions: CommunityReaction[];
  userId: string | null;
  replyCount?: number;
  isAuthor?: boolean;
  onReact: (type: ReactionType) => void;
  onReplyClick?: () => void;
  onDelete?: () => void;
}

export function ReactionBar({
  reactions,
  userId,
  replyCount,
  isAuthor,
  onReact,
  onReplyClick,
  onDelete,
}: Props) {
  const thumbsCount = countReactions(reactions, "thumbs_up");
  const heartCount  = countReactions(reactions, "heart");
  const myThumb     = userId ? hasReacted(reactions, userId, "thumbs_up") : false;
  const myHeart     = userId ? hasReacted(reactions, userId, "heart")     : false;

  return (
    <div className="flex items-center gap-5 mt-3">
      {/* Reply */}
      {onReplyClick !== undefined && (
        <button
          onClick={onReplyClick}
          className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors text-xs font-medium"
        >
          <MessageCircle size={15} />
          {replyCount !== undefined && replyCount > 0 && <span>{replyCount}</span>}
        </button>
      )}

      {/* Thumbs Up */}
      <button
        onClick={() => userId && onReact("thumbs_up")}
        disabled={!userId}
        className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-default ${
          myThumb
            ? "text-gray-900"
            : "text-gray-500 hover:text-gray-900"
        }`}
      >
        <ThumbsUp size={15} fill={myThumb ? "currentColor" : "none"} />
        {thumbsCount > 0 && <span>{thumbsCount}</span>}
      </button>

      {/* Heart */}
      <button
        onClick={() => userId && onReact("heart")}
        disabled={!userId}
        className={`flex items-center gap-1.5 text-xs font-medium transition-colors disabled:cursor-default ${
          myHeart
            ? "text-rose-500"
            : "text-gray-500 hover:text-rose-500"
        }`}
      >
        <Heart size={15} fill={myHeart ? "currentColor" : "none"} />
        {heartCount > 0 && <span>{heartCount}</span>}
      </button>

      {/* Delete (author only) */}
      {isAuthor && onDelete && (
        <button
          onClick={onDelete}
          className="ml-auto text-gray-300 hover:text-red-400 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
