"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";

interface UserContextValue {
  user: User | null;
  profile: Profile | null;
}

const UserContext = createContext<UserContextValue>({ user: null, profile: null });

export function UserProvider({
  children,
  user,
  profile,
}: {
  children: React.ReactNode;
  user: User | null;
  profile: Profile | null;
}) {
  return (
    <UserContext.Provider value={{ user, profile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  return useContext(UserContext);
}
