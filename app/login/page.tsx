"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, sendPasswordReset } from "@/lib/auth";
import ZoomCountdownBar from "@/components/ZoomCountdownBar";
import { BOOK_AMAZON_URL } from "@/lib/site-config";

// Admin access code — change this to secure access
const ADMIN_CODE = "1234";

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
            <h1 className="text-2xl font-bold">Thank You.</h1>
            <p className="text-sm text-white/50 mt-1 tracking-wide">See it. Believe it. Receive it.</p>
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
            <h1 className="text-2xl font-bold">Thank You.</h1>
            <p className="text-sm text-gray-400 mt-1 tracking-wide">See it. Believe it. Receive it.</p>
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

            {/* Email form */}
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
