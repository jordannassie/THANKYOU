"use client";

import { useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { mockCommunityPosts, CommunityPost } from "@/lib/mock-data";

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>(mockCommunityPosts);
  const [shareText, setShareText] = useState("");
  const [sharing, setSharing] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `c_${Date.now()}`,
                  author: "Thank You.",
                  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                  content: text,
                  date: "Just now",
                },
              ],
            }
          : p
      )
    );
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleShare = () => {
    if (!shareText.trim()) return;
    setSharing(true);
    setTimeout(() => {
      setPosts((prev) => [
        {
          id: `post_${Date.now()}`,
          author: "Thank You.",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
          date: "Just now",
          content: shareText,
          likes: 0,
          liked: false,
          comments: [],
        },
        ...prev,
      ]);
      setShareText("");
      setSharing(false);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Community</h1>
        <p className="text-gray-500 text-sm mt-1">We&apos;re stronger together.</p>
      </div>

      {/* Share Box */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="text-sm font-semibold mb-3">Share Something</h2>
        <textarea
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          rows={3}
          placeholder="Share a testimony, gratitude, or encouragement..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400 resize-none"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleShare}
            disabled={sharing || !shareText.trim()}
            className="inline-flex items-center gap-1.5 bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={13} />
            {sharing ? "Sharing..." : "Share"}
          </button>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-5">
              {/* Author */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shrink-0">
                  <img
                    src={post.avatar}
                    alt={post.author}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold">{post.author}</p>
                  <p className="text-xs text-gray-400">{post.date}</p>
                </div>
              </div>

              {/* Content */}
              <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    post.liked ? "text-black font-medium" : "text-gray-400 hover:text-black"
                  }`}
                >
                  <Heart size={16} fill={post.liked ? "currentColor" : "none"} />
                  {post.likes}
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

            {/* Comments */}
            {expandedComments.has(post.id) && (
              <div className="border-t border-gray-100 bg-gray-50">
                {post.comments.length > 0 && (
                  <div className="px-5 py-4 space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 shrink-0">
                          <img
                            src={comment.avatar}
                            alt={comment.author}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 bg-white rounded-xl px-3 py-2 border border-gray-100">
                          <p className="text-xs font-semibold">{comment.author}</p>
                          <p className="text-xs text-gray-600 mt-0.5">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-5 pb-4 flex gap-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ""}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                    placeholder="Write a comment..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-black/10 bg-white"
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="text-gray-400 hover:text-black transition-colors px-2"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
