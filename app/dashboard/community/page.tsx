"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/components/providers/UserProvider";
import { mockCommunityPosts } from "@/lib/mock-data";

// ── Types ──────────────────────────────────────────────────────────────────

interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
}

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  community_likes: { user_id: string }[];
  community_comments: PostComment[];
}

// ── Helper ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

type MiniProfile = { full_name: string | null; avatar_url: string | null } | null;

function initials(p: MiniProfile): string {
  const name = p?.full_name?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
}

function firstName(p: MiniProfile): string {
  return p?.full_name?.trim().split(/\s+/)[0] ?? "Member";
}

function Avatar({ profile, size = "md" }: { profile: MiniProfile; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-7 h-7 text-[10px]" : "w-10 h-10 text-sm";
  return (
    <div className={`${dim} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-semibold shrink-0`}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.full_name ?? ""} className="w-full h-full object-cover" />
      ) : (
        <span>{initials(profile)}</span>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const { user, profile, isDemo } = useUser();
  const supabase = createClient();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareText, setShareText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});

  // ── Fetch posts ────────────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    if (isDemo) {
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("community_posts")
      .select(`
        id, content, created_at, user_id,
        profiles:user_id ( full_name, avatar_url ),
        community_likes ( user_id ),
        community_comments (
          id, content, created_at, user_id,
          profiles:user_id ( full_name, avatar_url )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setPosts(data as unknown as Post[]);
    }
    setLoading(false);
  }, [isDemo, supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Share post ─────────────────────────────────────────────────────────

  const handleShare = async () => {
    if (!shareText.trim() || !user) return;
    setSharing(true);
    setShareError("");

    const { data, error } = await supabase
      .from("community_posts")
      .insert({ user_id: user.id, content: shareText.trim() })
      .select(`
        id, content, created_at, user_id,
        profiles:user_id ( full_name, avatar_url ),
        community_likes ( user_id ),
        community_comments (
          id, content, created_at, user_id,
          profiles:user_id ( full_name, avatar_url )
        )
      `)
      .single();

    if (error) {
      setShareError("Could not post. Please try again.");
    } else if (data) {
      setPosts((prev) => [data as unknown as Post, ...prev]);
      setShareText("");
    }
    setSharing(false);
  };

  // ── Like / unlike ──────────────────────────────────────────────────────

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const alreadyLiked = post.community_likes.some((l) => l.user_id === user.id);

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id !== postId ? p : {
          ...p,
          community_likes: alreadyLiked
            ? p.community_likes.filter((l) => l.user_id !== user.id)
            : [...p.community_likes, { user_id: user.id }],
        }
      )
    );

    if (alreadyLiked) {
      await supabase
        .from("community_likes")
        .delete()
        .match({ post_id: postId, user_id: user.id });
    } else {
      await supabase
        .from("community_likes")
        .insert({ post_id: postId, user_id: user.id });
    }
  };

  // ── Toggle comments ───────────────────────────────────────────────────

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  // ── Add comment ───────────────────────────────────────────────────────

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text || !user) return;
    setCommentLoading((prev) => ({ ...prev, [postId]: true }));

    const { data, error } = await supabase
      .from("community_comments")
      .insert({ post_id: postId, user_id: user.id, content: text })
      .select(`id, content, created_at, user_id, profiles:user_id ( full_name, avatar_url )`)
      .single();

    if (!error && data) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId ? p : {
            ...p,
            community_comments: [...p.community_comments, data as unknown as PostComment],
          }
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    }
    setCommentLoading((prev) => ({ ...prev, [postId]: false }));
  };

  // ── Demo fallback ──────────────────────────────────────────────────────

  if (isDemo) {
    return <DemoView />;
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={22} className="animate-spin text-gray-300" />
      </div>
    );
  }

  // ── Real view ──────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
        <p className="text-gray-500 text-sm mt-1">We&apos;re stronger together.</p>
      </div>

      {/* Share Box */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex gap-3">
          <Avatar profile={profile} />
          <div className="flex-1">
            <textarea
              value={shareText}
              onChange={(e) => setShareText(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Share a testimony, gratitude, or encouragement..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 resize-none"
            />
            {shareError && (
              <p className="text-xs text-red-500 mt-1">{shareError}</p>
            )}
            <div className="flex justify-end mt-2">
              <button
                onClick={handleShare}
                disabled={sharing || !shareText.trim()}
                className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sharing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                {sharing ? "Sharing..." : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageCircle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No posts yet. Be the first to share something.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const liked = user ? post.community_likes.some((l) => l.user_id === user.id) : false;
            const showComments = expandedComments.has(post.id);
            const authorName = firstName(post.profiles);

            return (
              <div key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar profile={post.profiles} />
                    <div>
                      <p className="text-sm font-semibold">{authorName}</p>
                      <p className="text-xs text-gray-400">{timeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(post.id)}
                      disabled={!user}
                      className={`flex items-center gap-1.5 text-sm transition-colors ${
                        liked ? "text-black font-medium" : "text-gray-400 hover:text-black"
                      } disabled:cursor-default`}
                    >
                      <Heart size={16} fill={liked ? "currentColor" : "none"} />
                      {post.community_likes.length}
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors"
                    >
                      <MessageCircle size={16} />
                      {post.community_comments.length}
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {showComments && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {post.community_comments.length > 0 && (
                      <div className="px-5 py-4 space-y-3">
                        {post.community_comments.map((comment) => {
                          const commenterName = firstName(comment.profiles);
                          return (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar profile={comment.profiles} size="sm" />
                              <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                                <p className="text-xs font-semibold">{commenterName}</p>
                                <p className="text-xs text-gray-600 mt-0.5">{comment.content}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {user && (
                      <div className="px-5 pb-4 flex gap-2">
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                          placeholder="Write a comment..."
                          maxLength={500}
                          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          disabled={commentLoading[post.id]}
                          className="text-gray-400 hover:text-black transition-colors px-2 disabled:opacity-40"
                        >
                          {commentLoading[post.id]
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Send size={14} />
                          }
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Demo fallback component ────────────────────────────────────────────────

function DemoView() {
  const [posts] = useState(mockCommunityPosts);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const toggleLike = (id: string) =>
    setLiked((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleComments = (id: string) =>
    setExpandedComments((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
        <p className="text-gray-500 text-sm mt-1">We&apos;re stronger together.</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-500">
        <strong className="text-black">Demo mode</strong> — Sign in to share and interact with the community.
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                  <img src={post.avatar} alt={post.author} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{post.author}</p>
                  <p className="text-xs text-gray-400">{post.date}</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${liked.has(post.id) ? "text-black font-medium" : "text-gray-400 hover:text-black"}`}
                >
                  <Heart size={16} fill={liked.has(post.id) ? "currentColor" : "none"} />
                  {post.likes + (liked.has(post.id) ? 1 : 0)}
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-black transition-colors"
                >
                  <MessageCircle size={16} />
                  {post.comments.length}
                </button>
              </div>
            </div>
            {expandedComments.has(post.id) && post.comments.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 space-y-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                      <img src={comment.avatar} alt={comment.author} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <p className="text-xs font-semibold">{comment.author}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
