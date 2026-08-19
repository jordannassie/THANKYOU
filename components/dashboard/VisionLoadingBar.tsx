"use client";

/**
 * VisionLoadingBar
 *
 * Animated loading state used while AI image generation is in progress.
 * Shows a sweeping rainbow gradient bar + bouncing dots + status text.
 */

export default function VisionLoadingBar() {
  return (
    <>
      <style>{`
        @keyframes vb-sweep {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes vb-bounce {
          0%, 80%, 100% { transform: translateY(0) scale(0.6); opacity: 0.4; }
          40%            { transform: translateY(-6px) scale(1);  opacity: 1; }
        }
        @keyframes vb-pulse-text {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.6; }
        }
      `}</style>

      <div
        className="mt-3 rounded-2xl overflow-hidden"
        style={{
          background: "white",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 2px 16px rgba(124,58,237,0.08)",
        }}
      >
        {/* ── Sweeping gradient bar ── */}
        <div
          style={{
            height: 4,
            background:
              "linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4, #f59e0b, #ec4899, #7c3aed, #2563eb)",
            backgroundSize: "300% 100%",
            animation: "vb-sweep 2.4s linear infinite",
          }}
        />

        {/* ── Content ── */}
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            {/* Bouncing dots */}
            <div className="flex items-end gap-1.5" aria-hidden>
              {[
                { color: "#7c3aed", delay: "0s" },
                { color: "#2563eb", delay: "0.18s" },
                { color: "#f59e0b", delay: "0.36s" },
              ].map((dot, i) => (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: dot.color,
                    animation: `vb-bounce 1.3s ease-in-out ${dot.delay} infinite`,
                  }}
                />
              ))}
            </div>

            {/* Label */}
            <span
              className="text-sm font-semibold text-gray-900"
              style={{ animation: "vb-pulse-text 2s ease-in-out infinite" }}
            >
              Creating your vision…
            </span>
          </div>

          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            AI is painting your vision — usually takes 30&ndash;90 seconds.
            Keep this window open.
          </p>

          {/* Progress shimmer track */}
          <div
            className="mt-3 rounded-full overflow-hidden"
            style={{ height: 3, background: "rgba(0,0,0,0.05)" }}
          >
            <div
              style={{
                height: "100%",
                width: "100%",
                background:
                  "linear-gradient(90deg, transparent 0%, #7c3aed 30%, #2563eb 50%, #f59e0b 70%, transparent 100%)",
                backgroundSize: "200% 100%",
                animation: "vb-sweep 1.8s linear infinite",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
