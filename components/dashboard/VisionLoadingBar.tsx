"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

/**
 * VisionLoadingBar — polished AI generation loading state.
 * Used on dashboard + vision board while GPT Image 2 is working.
 */

const STEPS = [
  { id: 1, label: "Understanding prompt" },
  { id: 2, label: "Generating images" },
  { id: 3, label: "Final touches" },
];

export default function VisionLoadingBar() {
  const [progress, setProgress] = useState(8);

  // Simulate progress — slows as it approaches 92% (real completion comes from polling)
  useEffect(() => {
    const tick = setInterval(() => {
      setProgress((p) => {
        if (p >= 92) return p;
        const increment = p < 30 ? 4 : p < 60 ? 2.5 : p < 80 ? 1.2 : 0.4;
        return Math.min(92, p + increment);
      });
    }, 900);
    return () => clearInterval(tick);
  }, []);

  const activeStep = progress < 28 ? 1 : progress < 78 ? 2 : 3;

  return (
    <>
      <style>{`
        @keyframes vb-ring-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vb-sparkle-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.08); opacity: 0.85; }
        }
      `}</style>

      <div
        className="mt-3 rounded-2xl overflow-hidden bg-white"
        style={{
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 4px 24px rgba(99,102,241,0.10)",
        }}
      >
        {/* Rainbow top accent */}
        <div
          className="h-1 w-full"
          style={{
            background:
              "linear-gradient(90deg, #3b82f6, #06b6d4, #22c55e, #eab308, #f97316, #ec4899)",
          }}
        />

        <div className="px-5 py-5">
          <div className="flex items-start gap-4">
            {/* Sparkle orb */}
            <div className="relative shrink-0 w-14 h-14 flex items-center justify-center">
              <div
                className="absolute inset-0 rounded-full opacity-80"
                style={{
                  background:
                    "conic-gradient(from 0deg, #6366f1, #3b82f6, #06b6d4, #a855f7, #6366f1)",
                  animation: "vb-ring-spin 3s linear infinite",
                  padding: 2,
                }}
              >
                <div className="w-full h-full rounded-full bg-white" />
              </div>
              <div
                className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 flex items-center justify-center shadow-sm"
                style={{ animation: "vb-sparkle-pulse 2s ease-in-out infinite" }}
              >
                <Sparkles size={18} className="text-indigo-500" strokeWidth={2} />
              </div>
            </div>

            {/* Text + progress */}
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-base font-semibold text-gray-900 tracking-tight">
                Creating your vision…
              </p>
              <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                AI is generating your vision image — this usually takes 30–90 seconds.
                Keep this window open.
              </p>

              {/* Progress bar + percentage */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(90deg, #6366f1, #3b82f6, #8b5cf6)",
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-violet-600 tabular-nums w-10 text-right">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Step indicators */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
              {STEPS.map((step, i) => {
                const isActive = step.id === activeStep;
                const isDone = step.id < activeStep;

                return (
                  <div key={step.id} className="flex items-center flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={[
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-colors",
                          isActive
                            ? "border-indigo-500 bg-indigo-50 text-indigo-600"
                            : isDone
                            ? "border-indigo-200 bg-indigo-50 text-indigo-400"
                            : "border-gray-200 bg-white text-gray-400",
                        ].join(" ")}
                      >
                        {step.id}
                      </div>
                      <span
                        className={[
                          "text-xs truncate hidden sm:inline",
                          isActive
                            ? "font-semibold text-gray-900"
                            : "text-gray-400",
                        ].join(" ")}
                      >
                        {step.label}
                      </span>
                    </div>

                    {/* Connector */}
                    {i < STEPS.length - 1 && (
                      <div
                        className="flex-1 mx-2 h-px min-w-[12px] border-t border-dashed border-gray-200"
                        aria-hidden
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile step label */}
            <p className="sm:hidden text-xs font-semibold text-gray-700 mt-2 text-center">
              {STEPS.find((s) => s.id === activeStep)?.label}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
