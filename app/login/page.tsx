"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, sendPasswordReset, signInWithGoogle } from "@/lib/auth";
import ZoomCountdownBar from "@/components/ZoomCountdownBar";
import { BOOK_AMAZON_URL } from "@/lib/site-config";

// Admin access code — change this to secure access
const ADMIN_CODE = "1234";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M47.52 24.56c0-1.61-.14-3.16-.41-4.64H24v8.78h13.19c-.57 3.01-2.29 5.56-4.88 7.27v6.04h7.9c4.62-4.26 7.31-10.53 7.31-17.45z"/>
      <path fill="#34A853" d="M24 48c6.63 0 12.19-2.2 16.25-5.99l-7.9-6.04c-2.19 1.47-5 2.34-8.35 2.34-6.42 0-11.86-4.34-13.8-10.17H2.02v6.23C6.06 42.66 14.42 48 24 48z"/>
      <path fill="#FBBC05" d="M10.2 28.14A14.47 14.47 0 0 1 9.6 24c0-1.44.25-2.84.6-4.14v-6.23H2.02A23.97 23.97 0 0 0 0 24c0 3.87.93 7.53 2.02 10.37l8.18-6.23z"/>
      <path fill="#EA4335" d="M24 9.69c3.62 0 6.87 1.24 9.42 3.68l7.07-7.07C36.18 2.43 30.62 0 24 0 14.42 0 6.06 5.34 2.02 13.63l8.18 6.23C12.14 14.03 17.58 9.69 24 9.69z"/>
    </svg>
  );
}

type Mode = "signin" | "signup" | "forgot";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(urlError ?? "");
  const [info, setInfo] = useState("");

  // Admin access
  const [showAdminCode, setShowAdminCode] = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleAdminAccess = () => {
    if (adminCode === ADMIN_CODE) {
      // Set cookie readable by server proxy
      document.cookie = `ty_admin_code=${ADMIN_CODE}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/admin");
    } else {
      setAdminError("Incorrect code.");
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error ?? "Google sign-in failed.");
      setGoogleLoading(false);
    }
    // On success Supabase redirects to /auth/callback — no manual navigation needed
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setInfo("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (mode === "forgot") {
      const result = await sendPasswordReset(email);
      setLoading(false);
      if (result.success) {
        setInfo("Check your email for a password reset link.");
      } else {
        setError(result.error ?? "Something went wrong.");
      }
      return;
    }

    if (mode === "signin") {
      const result = await signIn(email, password);
      setLoading(false);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error ?? "Sign in failed.");
      }
      return;
    }

    if (mode === "signup") {
      const result = await signUp(name, email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? "Sign up failed.");
        return;
      }
      if (result.needsConfirmation) {
        setInfo("Account created! Check your email to confirm before signing in.");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <ZoomCountdownBar />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left — Brand Panel */}
        <div className="hidden md:flex md:w-1/2 bg-black text-white flex-col justify-between p-12">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Thank%20you%20black.png"
              alt="Thank You."
              className="h-16 w-auto object-contain"
            />
            <p className="text-sm text-white/50 mt-3 tracking-wide">Receive. Believe. Thank.</p>
          </div>
          <div className="space-y-6">
            <blockquote className="font-serif text-2xl md:text-3xl leading-relaxed text-white/90 italic">
              &ldquo;Commit to the Lord whatever you do, and He will establish your plans.&rdquo;
            </blockquote>
            <p className="text-white/50 text-sm">— Proverbs 16:3</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/20 text-xs">Thank You. All rights reserved.</p>
            <a
              href={BOOK_AMAZON_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              New to Thank You.? Start with the book →
            </a>
          </div>
        </div>

        {/* Right — Form Panel */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 bg-white">
          {/* Mobile brand */}
          <div className="md:hidden mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Thank%20you%20black.png"
              alt="Thank You."
              className="h-12 w-auto object-contain"
            />
            <p className="text-sm text-gray-400 mt-2 tracking-wide">Receive. Believe. Thank.</p>
          </div>

          <div className="max-w-sm w-full mx-auto">
            {/* Heading */}
            <h2 className="text-3xl font-bold tracking-tight">
              {mode === "signin" && "Welcome Back"}
              {mode === "signup" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              {mode === "signin" && "Continue building the future you're believing God for."}
              {mode === "signup" && "Start seeing the future you are believing God for."}
              {mode === "forgot" && "Enter your email and we'll send you a reset link."}
            </p>

            {/* Google OAuth — TOP, shown on signin + signup only */}
            {mode !== "forgot" && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading || loading}
                  className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </button>

                <div className="flex items-center gap-3 mt-5">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">or continue with email</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
              </div>
            )}

            {/* Email form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                />
              </div>

              {mode !== "forgot" && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-gray-700">Password</label>
                    {mode === "signin" && (
                      <button
                        type="button"
                        onClick={() => switchMode("forgot")}
                        className="text-xs text-gray-400 hover:text-black transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors"
                    >
                      {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
              )}
              {info && (
                <p className="text-sm text-gray-700 bg-gray-50 px-4 py-3 rounded-xl leading-relaxed">{info}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === "signin" && "Sign In"}
                {mode === "signup" && "Create My Account"}
                {mode === "forgot" && "Send Reset Link"}
              </button>

              {/* Demo button — sign in mode only */}
              {mode === "signin" && (
                <button
                  type="button"
                  onClick={() => {
                    document.cookie = "ty_demo_user=true; path=/; max-age=86400; SameSite=Lax";
                    router.push("/dashboard");
                  }}
                  className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors text-sm"
                >
                  View Demo Dashboard
                </button>
              )}
            </form>

            {/* Mode switching */}
            <div className="mt-6 text-center text-sm text-gray-500">
              {mode === "signin" && (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => switchMode("signup")}
                    className="font-medium text-black hover:underline"
                  >
                    Create Account
                  </button>
                </>
              )}
              {mode === "signup" && (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => switchMode("signin")}
                    className="font-medium text-black hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <button
                  onClick={() => switchMode("signin")}
                  className="font-medium text-black hover:underline"
                >
                  Back to Sign In
                </button>
              )}
            </div>

            {/* ── Admin Access ── */}
            <div className="mt-10 pt-6 border-t border-gray-100">
              {!showAdminCode ? (
                <button
                  onClick={() => { setShowAdminCode(true); setAdminError(""); }}
                  className="w-full text-xs text-gray-300 hover:text-gray-500 transition-colors py-1"
                >
                  Staff access
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={adminCode}
                      onChange={(e) => { setAdminCode(e.target.value); setAdminError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminAccess()}
                      placeholder="Access code"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                      autoFocus
                    />
                    <button
                      onClick={handleAdminAccess}
                      className="bg-black text-white text-xs font-medium px-4 py-2 rounded-xl hover:bg-gray-900 transition-colors"
                    >
                      Enter
                    </button>
                  </div>
                  {adminError && (
                    <p className="text-xs text-red-500 text-center">{adminError}</p>
                  )}
                  <button
                    onClick={() => { setShowAdminCode(false); setAdminCode(""); setAdminError(""); }}
                    className="w-full text-xs text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
