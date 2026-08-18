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
    <div className="flex items-center gap-4 mt-3">
      {/* Reply */}
      {onReplyClick !== undefined && (
        <button
          onClick={onReplyClick}
          className="flex items-center gap-1 text-gray-400 hover:text-blue-500 transition-colors text-xs"
        >
          <MessageCircle size={14} />
          {replyCount !== undefined && replyCount > 0 && (
            <span>{replyCount}</span>
          )}
        </button>
      )}

      {/* Thumbs Up */}
      <button
        onClick={() => userId && onReact("thumbs_up")}
        disabled={!userId}
        className={`flex items-center gap-1 text-xs transition-colors disabled:cursor-default ${
          myThumb ? "text-black font-semibold" : "text-gray-400 hover:text-black"
        }`}
      >
        <ThumbsUp
          size={14}
          className={myThumb ? "fill-black" : ""}
        />
        {thumbsCount > 0 && <span>{thumbsCount}</span>}
      </button>

      {/* Heart */}
      <button
        onClick={() => userId && onReact("heart")}
        disabled={!userId}
        className={`flex items-center gap-1 text-xs transition-colors disabled:cursor-default ${
          myHeart ? "text-rose-500 font-semibold" : "text-gray-400 hover:text-rose-500"
        }`}
      >
        <Heart
          size={14}
          className={myHeart ? "fill-rose-500" : ""}
        />
        {heartCount > 0 && <span>{heartCount}</span>}
      </button>

      {/* Delete (author only) */}
      {isAuthor && onDelete && (
        <button
          onClick={onDelete}
          className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
