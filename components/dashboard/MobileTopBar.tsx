"use client";

import { useUser } from "@/components/providers/UserProvider";
import { getInitials } from "@/lib/types";

export default function MobileTopBar() {
  const { user, profile } = useUser();
  const initials = getInitials(profile, user?.email);
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="bg-black text-white px-5 py-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold">Thank You.</h1>
        <p className="text-[10px] text-white/50 tracking-wide">Receive. Believe. Thank.</p>
      </div>
      <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 bg-white/20 flex items-center justify-center text-white text-xs font-semibold">
        {avatarUrl ? (
          <img src={avatarUrl} alt={profile?.full_name ?? "User"} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
    </div>
  );
}
