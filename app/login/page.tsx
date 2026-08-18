"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, signInWithGoogle, sendPasswordReset } from "@/lib/auth";
import ZoomCountdownBar from "@/components/ZoomCountdownBar";
import { BOOK_AMAZON_URL } from "@/lib/site-config";

type Mode = "signin" | "signup" | "forgot";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="shrink-0">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

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

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error ?? "Google sign-in failed.");
      setGoogleLoading(false);
    }
    // On success, Google OAuth redirects — no further action needed here.
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

            {/* Google button — sign in / sign up only */}
            {mode !== "forgot" && (
              <button
                onClick={handleGoogle}
                disabled={googleLoading}
                className="mt-8 w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {googleLoading ? (
                  <Loader2 size={16} className="animate-spin text-gray-400" />
                ) : (
                  <GoogleIcon />
                )}
                Continue with Google
              </button>
            )}

            {mode !== "forgot" && (
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
            )}

            {/* Email form */}
            <form onSubmit={handleSubmit} className={`${mode === "forgot" ? "mt-8" : ""} space-y-4`}>
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
