"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      // Check if already in a recovery session via auth state
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setSessionReady(true);
        else setSessionError("Invalid or expired reset link. Please request a new one.");
      });
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error: err }) => {
      if (err) setSessionError("This reset link has expired or is invalid.");
      else setSessionReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — matches login page */}
      <div className="hidden md:flex md:w-1/2 bg-black text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-2xl font-bold">Thank You.</h1>
          <p className="text-sm text-white/50 mt-1 tracking-wide">Receive. Believe. Thank.</p>
        </div>
        <blockquote className="font-serif text-2xl leading-relaxed text-white/90 italic">
          &ldquo;Commit to the Lord whatever you do, and He will establish your plans.&rdquo;
          <p className="text-white/50 text-sm mt-3 not-italic">— Proverbs 16:3</p>
        </blockquote>
        <p className="text-white/20 text-xs">Thank You. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-white">
        <div className="md:hidden mb-10">
          <h1 className="text-2xl font-bold">Thank You.</h1>
          <p className="text-sm text-gray-400 mt-1 tracking-wide">Receive. Believe. Thank.</p>
        </div>

        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-3xl font-bold tracking-tight">Set New Password</h2>

          {done ? (
            <div className="mt-8 bg-gray-50 rounded-xl px-5 py-5 text-center">
              <p className="text-sm font-medium text-gray-700">Password updated successfully.</p>
              <p className="text-xs text-gray-400 mt-1">Redirecting to your dashboard…</p>
            </div>
          ) : sessionError ? (
            <div className="mt-8 space-y-4">
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{sessionError}</p>
              <button
                onClick={() => router.push("/login")}
                className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors text-sm"
              >
                Back to Login
              </button>
            </div>
          ) : !sessionReady ? (
            <div className="mt-8 flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Verifying link…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <p className="text-gray-500 text-sm">Enter a new password for your account.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min. 6 characters"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                />
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Update Password
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={20} className="animate-spin text-gray-400" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
