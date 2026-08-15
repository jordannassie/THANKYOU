"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn, signUp, signInAsDemo } from "@/lib/auth";
import ZoomCountdownBar from "@/components/ZoomCountdownBar";
import { BOOK_AMAZON_URL } from "@/lib/site-config";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let result;
      if (mode === "signin") {
        result = await signIn(email, password);
      } else {
        result = await signUp(name, email, password);
      }
      if (result.success) {
        router.push("/dashboard");
      } else {
        setError(result.error || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    signInAsDemo();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Zoom Countdown Bar */}
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
            <h2 className="text-3xl font-bold tracking-tight">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              {mode === "signin"
                ? "Continue building the future you're believing God for."
                : "Start seeing the future you are believing God for."}
            </p>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
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

              {error && (
                <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-medium py-3 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {mode === "signin" ? "Sign In" : "Create My Account"}
              </button>
            </form>

            {/* Demo Dashboard button — only show on signin mode */}
            {mode === "signin" && (
              <div className="mt-3">
                <button
                  onClick={handleDemo}
                  className="w-full border border-gray-200 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                >
                  View Demo Dashboard
                </button>
                <p className="text-center text-xs text-gray-400 mt-2">
                  Explore Thank You. before joining.
                </p>
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mt-6">
              {mode === "signin" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setError(""); }}
                    className="font-medium text-black hover:underline"
                  >
                    Create Account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("signin"); setError(""); }}
                    className="font-medium text-black hover:underline"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
