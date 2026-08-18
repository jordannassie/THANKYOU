"use client";

import { useState } from "react";
import { MessageCircle, Trash2 } from "lucide-react";
import type { CommunityPost, MiniProfile, ReactionType } from "@/lib/types/community";
import { timeAgo, getFirstName } from "@/lib/types/community";
import { AvatarBubble } from "./AvatarBubble";
import { ReactionBar } from "./ReactionBar";
import { ReplyThread } from "./ReplyThread";

interface Props {
  post: CommunityPost;
  userId: string | null;
  userProfile: MiniProfile | null;
  onReactPost: (postId: string, type: ReactionType) => void;
  onReactComment: (commentId: string, type: ReactionType) => void;
  onReply: (postId: string, content: string, parentId: string | null) => Promise<string | null>;
  onDeletePost: (postId: string) => void;
  onDeleteComment: (commentId: string, postId: string) => void;
}

export function CommunityPostCard({
  post,
  userId,
  userProfile,
  onReactPost,
  onReactComment,
  onReply,
  onDeletePost,
  onDeleteComment,
}: Props) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isAuthor = userId === post.user_id;
  const replyCount = post.community_comments.length;
  const authorName = getFirstName(post.profiles);

  const handleDeletePost = () => {
    if (confirmDelete) {
      onDeletePost(post.id);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <article className="border-b border-gray-100 px-4 py-4 hover:bg-gray-50/50 transition-colors">
      <div className="flex gap-3">
        {/* Avatar column */}
        <div className="flex flex-col items-center">
          <AvatarBubble profile={post.profiles} size="lg" />
          {repliesOpen && replyCount > 0 && (
            <div className="w-px flex-1 bg-gray-100 mt-1" />
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">{authorName}</span>
              {post.profiles?.full_name && post.profiles.full_name !== authorName && (
                <span className="text-xs text-gray-400 truncate max-w-[120px]">
                  {post.profiles.full_name}
                </span>
              )}
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{timeAgo(post.created_at)}</span>
            </div>

            {/* Author actions */}
            {isAuthor && (
              <div className="shrink-0">
                {confirmDelete ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-500 font-medium">Delete?</span>
                    <button
                      onClick={handleDeletePost}
                      className="text-red-500 hover:text-red-700 font-medium"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-gray-200 hover:text-red-400 transition-colors"
                    title="Delete post"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Post text */}
          <p className="text-sm text-gray-800 mt-1.5 leading-relaxed break-words whitespace-pre-wrap">
            {post.content}
          </p>

          {/* Reaction bar */}
          <ReactionBar
            reactions={post.community_reactions}
            userId={userId}
            replyCount={replyCount}
            isAuthor={false} // delete handled above
            onReact={(type) => onReactPost(post.id, type)}
            onReplyClick={() => setRepliesOpen((v) => !v)}
          />

          {/* Reply toggle indicator */}
          {replyCount > 0 && !repliesOpen && (
            <button
              onClick={() => setRepliesOpen(true)}
              className="mt-2 text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              <MessageCircle size={12} />
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          )}

          {/* Thread */}
          <ReplyThread
            comments={post.community_comments}
            userId={userId}
            userProfile={userProfile}
            postId={post.id}
            open={repliesOpen}
            onReact={onReactComment}
            onReply={onReply}
            onDelete={(commentId) => onDeleteComment(commentId, post.id)}
          />
        </div>
      </div>
    </article>
  );
}
