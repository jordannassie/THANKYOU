"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/UserProvider";
import type { CommunityPost, CommunityComment, CommunityReaction, ReactionType } from "@/lib/types/community";
import { PostComposer } from "./PostComposer";
import { CommunityPostCard } from "./CommunityPost";

// ── Supabase select fragment ───────────────────────────────────────────────

const REACTIONS_FRAG = `community_reactions ( id, user_id, reaction_type, post_id, comment_id )`;

const POST_SELECT = `
  id, content, created_at, user_id,
  profiles:user_id ( full_name, avatar_url ),
  ${REACTIONS_FRAG},
  community_comments (
    id, content, created_at, user_id, post_id, parent_comment_id,
    profiles:user_id ( full_name, avatar_url ),
    ${REACTIONS_FRAG}
  )
`.trim();

// ── Helper: cast Supabase rows to our types ────────────────────────────────

function castPost(row: unknown): CommunityPost {
  return row as unknown as CommunityPost;
}
function castComment(row: unknown): CommunityComment {
  return row as unknown as CommunityComment;
}

// ── Component ─────────────────────────────────────────────────────────────

export function CommunityFeed() {
  const { user, profile, isDemo } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [posts, setPosts]     = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Keep a ref so realtime callbacks always see fresh posts
  const postsRef = useRef<CommunityPost[]>([]);
  postsRef.current = posts;

  // ── Fetch full post with all related data ───────────────────────────────

  const fetchPost = useCallback(
    async (postId: string): Promise<CommunityPost | null> => {
      const { data, error } = await supabase
        .from("community_posts")
        .select(POST_SELECT)
        .eq("id", postId)
        .maybeSingle();

      if (error) {
        console.error("[community] fetchPost error:", error.message, error.details);
        return null;
      }
      return data ? castPost(data) : null;
    },
    [supabase]
  );

  // ── Initial load ────────────────────────────────────────────────────────

  const loadFeed = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("community_posts")
      .select(POST_SELECT)
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) {
      console.error("[community] loadFeed error:", error.message, error.details);
    } else {
      setPosts((data ?? []).map(castPost));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!isDemo) loadFeed();
    else setLoading(false);
  }, [isDemo, loadFeed]);

  // ── Realtime: new posts ─────────────────────────────────────────────────

  useEffect(() => {
    if (isDemo) return;

    const channel = supabase
      .channel("community-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        async (payload) => {
          const newId = payload.new.id as string;
          // Skip if we already have it (e.g. our own optimistic insert)
          if (postsRef.current.some((p) => p.id === newId)) return;
          const post = await fetchPost(newId);
          if (post) setPosts((prev) => [post, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isDemo, supabase, fetchPost]);

  // ── Create post ────────────────────────────────────────────────────────

  const handlePost = useCallback(
    async (content: string): Promise<string | null> => {
      if (!user) return "Please sign in to post.";

      // Insert without returning the full join (avoids profile join issues)
      const { data: inserted, error: insertErr } = await supabase
        .from("community_posts")
        .insert({ user_id: user.id, content })
        .select("id")
        .single();

      if (insertErr) {
        console.error("[community] insert post error:", insertErr.message, insertErr.details, insertErr.hint);
        if (insertErr.code === "42501") return "Permission denied — make sure you are signed in.";
        if (insertErr.code === "23514") return "Post is too long (max 1,000 characters).";
        return `Could not post: ${insertErr.message}`;
      }

      // Fetch full post and prepend optimistically
      const full = await fetchPost(inserted.id);
      if (full) {
        setPosts((prev) => [full, ...prev]);
      }
      return null;
    },
    [user, supabase, fetchPost]
  );

  // ── React to post ──────────────────────────────────────────────────────

  const handleReactPost = useCallback(
    async (postId: string, type: ReactionType) => {
      if (!user) return;

      const post = postsRef.current.find((p) => p.id === postId);
      if (!post) return;

      const existing = post.community_reactions.find(
        (r) => r.user_id === user.id && r.reaction_type === type && r.post_id === postId
      );

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            community_reactions: existing
              ? p.community_reactions.filter((r) => r.id !== existing.id)
              : [
                  ...p.community_reactions,
                  { id: `opt-${Date.now()}`, user_id: user.id, reaction_type: type, post_id: postId, comment_id: null } as CommunityReaction,
                ],
          };
        })
      );

      if (existing) {
        await supabase.from("community_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("community_reactions").insert({
          post_id: postId, user_id: user.id, reaction_type: type,
        });
      }
    },
    [user, supabase]
  );

  // ── React to comment ───────────────────────────────────────────────────

  const handleReactComment = useCallback(
    async (commentId: string, type: ReactionType) => {
      if (!user) return;

      // Find the post containing this comment
      const post = postsRef.current.find((p) =>
        p.community_comments.some((c) => c.id === commentId)
      );
      if (!post) return;

      const comment = post.community_comments.find((c) => c.id === commentId);
      if (!comment) return;

      const existing = comment.community_reactions.find(
        (r) => r.user_id === user.id && r.reaction_type === type && r.comment_id === commentId
      );

      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== post.id) return p;
          return {
            ...p,
            community_comments: p.community_comments.map((c) => {
              if (c.id !== commentId) return c;
              return {
                ...c,
                community_reactions: existing
                  ? c.community_reactions.filter((r) => r.id !== existing.id)
                  : [
                      ...c.community_reactions,
                      { id: `opt-${Date.now()}`, user_id: user.id, reaction_type: type, post_id: null, comment_id: commentId } as CommunityReaction,
                    ],
              };
            }),
          };
        })
      );

      if (existing) {
        await supabase.from("community_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("community_reactions").insert({
          comment_id: commentId, user_id: user.id, reaction_type: type,
        });
      }
    },
    [user, supabase]
  );

  // ── Reply ─────────────────────────────────────────────────────────────

  const handleReply = useCallback(
    async (postId: string, content: string, parentCommentId: string | null): Promise<string | null> => {
      if (!user) return "Please sign in to reply.";

      const { data: inserted, error } = await supabase
        .from("community_comments")
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          parent_comment_id: parentCommentId,
        })
        .select(`id, content, created_at, user_id, post_id, parent_comment_id,
                 profiles:user_id ( full_name, avatar_url ),
                 community_reactions ( id, user_id, reaction_type, post_id, comment_id )`)
        .single();

      if (error) {
        console.error("[community] insert comment error:", error.message, error.details);
        return `Could not reply: ${error.message}`;
      }

      const newComment = castComment(inserted);

      // Optimistic: add the new comment to the correct post
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return { ...p, community_comments: [...p.community_comments, newComment] };
        })
      );

      return null;
    },
    [user, supabase]
  );

  // ── Delete post ───────────────────────────────────────────────────────

  const handleDeletePost = useCallback(
    async (postId: string) => {
      if (!user) return;
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id); // extra guard

      if (error) {
        console.error("[community] delete post error:", error.message);
        // Restore post on failure
        loadFeed();
      }
    },
    [user, supabase, loadFeed]
  );

  // ── Delete comment ────────────────────────────────────────────────────

  const handleDeleteComment = useCallback(
    async (commentId: string, postId: string) => {
      if (!user) return;

      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            community_comments: p.community_comments.filter((c) => c.id !== commentId),
          };
        })
      );

      const { error } = await supabase
        .from("community_comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      if (error) {
        console.error("[community] delete comment error:", error.message);
        loadFeed();
      }
    },
    [user, supabase, loadFeed]
  );

  // ── Render ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={20} className="animate-spin text-gray-300" />
      </div>
    );
  }

  const miniProfile = profile
    ? { full_name: profile.full_name, avatar_url: profile.avatar_url }
    : null;

  return (
    <div>
      {/* Composer */}
      {!isDemo && user && (
        <PostComposer profile={miniProfile} onPost={handlePost} />
      )}

      {isDemo && (
        <div className="mx-4 my-4 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-500">
          <strong className="text-black">Demo mode</strong> — Sign in to post and interact with the community.
        </div>
      )}

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center text-gray-400 px-8">
          <MessageCircle size={32} className="mb-4 opacity-20" />
          <p className="text-sm font-medium text-gray-500">Start the conversation.</p>
          <p className="text-sm mt-1 max-w-xs">
            Share what you&apos;re thankful for, what you&apos;re believing for, or encourage someone today.
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <CommunityPostCard
              key={post.id}
              post={post}
              userId={user?.id ?? null}
              userProfile={miniProfile}
              onReactPost={handleReactPost}
              onReactComment={handleReactComment}
              onReply={handleReply}
              onDeletePost={handleDeletePost}
              onDeleteComment={handleDeleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}
