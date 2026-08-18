export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
  membership_status: "free" | "premium";
  created_at: string;
  updated_at: string;
}

/** First name extracted from full_name or email */
export function getFirstName(profile: Profile | null, email?: string | null): string {
  if (profile?.full_name) {
    return profile.full_name.split(" ")[0];
  }
  if (email) {
    return email.split("@")[0];
  }
  return "Friend";
}

/** Initials for avatar placeholder */
export function getInitials(profile: Profile | null, email?: string | null): string {
  if (profile?.full_name) {
    return profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email[0].toUpperCase();
  return "U";
}

// ── Vision Board ──────────────────────────────────────────────

export interface VisionImage {
  id: string;
  user_id: string;
  image_url: string;
  storage_path: string | null;
  prompt: string | null;
  source: "generated" | "uploaded";
  sort_order: number;
  created_at: string;
  updated_at: string;
}
