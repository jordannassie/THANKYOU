/**
 * Client-side auth helpers wrapping the Supabase browser client.
 * Replace with direct Supabase calls if you prefer; these are thin wrappers.
 * The server-side equivalent lives in lib/supabase/server.ts.
 */

import { createClient } from "@/lib/supabase/client";

function humaniseError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("Email not confirmed")) return "Please check your email to confirm your account.";
  if (msg.includes("User already registered") || msg.includes("already been registered"))
    return "An account with this email already exists.";
  if (msg.includes("Password should be at least")) return "Password must be at least 6 characters.";
  if (msg.includes("invalid email") || msg.includes("Unable to validate email"))
    return "Please enter a valid email address.";
  if (msg.includes("Email rate limit")) return "Too many attempts. Please try again later.";
  return msg;
}

export async function signIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: humaniseError(error.message) };
  return { success: true };
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } },
  });
  if (error) return { success: false, error: humaniseError(error.message) };
  // If session is null, email confirmation is required
  if (!data.session) {
    return { success: true, needsConfirmation: true };
  }
  return { success: true };
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "/auth/callback";

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
  if (error) return { success: false, error: humaniseError(error.message) };
  return { success: true };
}

export async function sendPasswordReset(
  email: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/reset-password`
      : "/auth/reset-password";

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { success: false, error: humaniseError(error.message) };
  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/** Client-side: use sparingly; prefer server-side getUser() for protected routes. */
export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
