"use client";

import { useState } from "react";
import type { CommunityComment, MiniProfile, ReactionType } from "@/lib/types/community";
import { timeAgo, getFirstName, buildCommentTree } from "@/lib/types/community";
import { AvatarBubble } from "./AvatarBubble";
import { ReactionBar } from "./ReactionBar";
import { ReplyComposer } from "./ReplyComposer";

const INITIAL_SHOW = 3;

interface CommentNodeProps {
  comment: CommunityComment;
  userId: string | null;
  userProfile: MiniProfile | null;
  depth: number;
  onReact: (commentId: string, type: ReactionType) => void;
  onReply: (postId: string, content: string, parentId: string | null) => Promise<string | null>;
  onDelete: (commentId: string) => void;
}

function CommentNode({
  comment,
  userId,
  userProfile,
  depth,
  onReact,
  onReply,
  onDelete,
}: CommentNodeProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const children = comment.replies ?? [];
  const visibleChildren = showAll ? children : children.slice(0, INITIAL_SHOW);
  const hiddenCount = children.length - INITIAL_SHOW;

  // Max 2 levels of visual nesting; deeper replies render flat under level 2
  const nextDepth = depth < 2 ? depth + 1 : depth;
  const isNested  = depth > 0;

  return (
    <div className={`flex gap-2.5 ${isNested ? "mt-3" : ""}`}>
      {/* Thread line for nested replies */}
      {isNested && (
        <div className="flex flex-col items-center">
          <AvatarBubble profile={comment.profiles} size="sm" />
          {children.length > 0 && (
            <div className="w-px flex-1 bg-gray-100 mt-1" />
          )}
        </div>
      )}

      {!isNested && <AvatarBubble profile={comment.profiles} size="sm" />}

      <div className="flex-1 min-w-0">
        {/* Author + time */}
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-900">
            {getFirstName(comment.profiles)}
          </span>
          <span className="text-[10px] text-gray-400">{timeAgo(comment.created_at)}</span>
        </div>

        {/* Content */}
        <p className="text-xs text-gray-700 mt-0.5 leading-relaxed break-words">
          {comment.content}
        </p>

        {/* Reactions + reply + delete */}
        <ReactionBar
          reactions={comment.community_reactions}
          userId={userId}
          replyCount={children.length}
          isAuthor={userId === comment.user_id}
          onReact={(type) => onReact(comment.id, type)}
          onReplyClick={depth < 2 ? () => setReplyOpen((v) => !v) : undefined}
          onDelete={() => onDelete(comment.id)}
        />

        {/* Inline reply composer */}
        {replyOpen && userId && (
          <ReplyComposer
            profile={userProfile}
            placeholder={`Reply to ${getFirstName(comment.profiles)}…`}
            onSubmit={(content) => onReply(comment.post_id, content, comment.id)}
            onCancel={() => setReplyOpen(false)}
            autoFocus
          />
        )}

        {/* Child replies */}
        {visibleChildren.length > 0 && (
          <div className={`mt-2 space-y-0 ${depth < 2 ? "pl-2 border-l border-gray-100" : ""}`}>
            {visibleChildren.map((child) => (
              <CommentNode
                key={child.id}
                comment={child}
                userId={userId}
                userProfile={userProfile}
                depth={nextDepth}
                onReact={onReact}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}

        {/* View more */}
        {hiddenCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-[10px] text-blue-500 hover:underline mt-1 block"
          >
            View {hiddenCount} more {hiddenCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── ReplyThread ────────────────────────────────────────────────────────────

interface ReplyThreadProps {
  comments: CommunityComment[];
  userId: string | null;
  userProfile: MiniProfile | null;
  postId: string;
  open: boolean;
  onReact: (commentId: string, type: ReactionType) => void;
  onReply: (postId: string, content: string, parentId: string | null) => Promise<string | null>;
  onDelete: (commentId: string) => void;
}

export function ReplyThread({
  comments,
  userId,
  userProfile,
  postId,
  open,
  onReact,
  onReply,
  onDelete,
}: ReplyThreadProps) {
  const [showAll, setShowAll] = useState(false);

  if (!open) return null;

  const roots = buildCommentTree(comments);
  const visible = showAll ? roots : roots.slice(0, INITIAL_SHOW);
  const hidden  = roots.length - INITIAL_SHOW;

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
      {/* Top-level reply composer */}
      {userId && (
        <ReplyComposer
          profile={userProfile}
          placeholder="Write a reply…"
          onSubmit={(content) => onReply(postId, content, null)}
        />
      )}

      {visible.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          userId={userId}
          userProfile={userProfile}
          depth={0}
          onReact={onReact}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}

      {hidden > 0 && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs text-blue-500 hover:underline"
        >
          View {hidden} more {hidden === 1 ? "reply" : "replies"}
        </button>
      )}
    </div>
  );
}
