// ── Community Types ────────────────────────────────────────────────────────

export type ReactionType = "thumbs_up" | "heart";

export interface MiniProfile {
  full_name: string | null;
  avatar_url: string | null;
}

export interface CommunityReaction {
  id: string;
  user_id: string;
  reaction_type: ReactionType;
  post_id: string | null;
  comment_id: string | null;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_comment_id: string | null;
  profiles: MiniProfile | null;
  community_reactions: CommunityReaction[];
  // Client-side computed: nested child replies
  replies?: CommunityComment[];
}

export interface CommunityPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: MiniProfile | null;
  community_reactions: CommunityReaction[];
  community_comments: CommunityComment[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getInitials(profile: MiniProfile | null): string {
  const name = profile?.full_name?.trim();
  if (!name) return "?";
  const parts = name.split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
}

export function getFirstName(profile: MiniProfile | null): string {
  return profile?.full_name?.trim().split(/\s+/)[0] ?? "Member";
}

/** Build a nested comment tree from flat list. Max depth enforced at render. */
export function buildCommentTree(comments: CommunityComment[]): CommunityComment[] {
  const map = new Map<string, CommunityComment>();
  const roots: CommunityComment[] = [];

  // Clone so we don't mutate the source
  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of map.values()) {
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  }

  return roots;
}

/** Count reactions of a given type on an item */
export function countReactions(reactions: CommunityReaction[], type: ReactionType): number {
  return reactions.filter((r) => r.reaction_type === type).length;
}

/** Check if current user has reacted with given type */
export function hasReacted(
  reactions: CommunityReaction[],
  userId: string,
  type: ReactionType
): boolean {
  return reactions.some((r) => r.user_id === userId && r.reaction_type === type);
}
