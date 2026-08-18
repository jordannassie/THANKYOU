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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Thank%20you%20black.png"
          alt="Thank You."
          className="h-9 w-auto object-contain"
        />
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
