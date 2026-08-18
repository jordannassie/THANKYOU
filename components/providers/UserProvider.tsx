"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
  isDemo: boolean;
}

const UserContext = createContext<UserContextValue>({ user: null, profile: null, isDemo: false });

export function UserProvider({
  children,
  user,
  profile,
  isDemo = false,
}: {
  children: React.ReactNode;
  user: User | null;
  profile: Profile | null;
  isDemo?: boolean;
}) {
  return (
    <UserContext.Provider value={{ user, profile, isDemo }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
