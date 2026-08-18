import type { MiniProfile } from "@/lib/types/community";
import { getInitials } from "@/lib/types/community";

interface Props {
  profile: MiniProfile | null;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-10 h-10 text-sm",
};

export function AvatarBubble({ profile, size = "md" }: Props) {
  return (
    <div
      className={`${sizes[size]} rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-semibold shrink-0 border border-gray-200`}
    >
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? ""}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{getInitials(profile)}</span>
      )}
    </div>
  );
}
