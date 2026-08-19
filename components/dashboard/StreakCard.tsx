"use client";

import { useState, useEffect } from "react";
import type { StreakData } from "@/app/api/streak/checkin/route";

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  /** Seed values from server/parent — replaced once the checkin call returns */
  initialStreak?: number;
  initialWeek?: boolean[];
  initialTodayIndex?: number;
}

export default function StreakCard({ initialStreak = 0, initialWeek, initialTodayIndex }: Props) {
  // Derive todayIndex client-side as fallback
  const clientTodayIndex = (() => {
    const d = new Date().getDay(); // 0=Sun
    return d === 0 ? 6 : d - 1;   // Mon=0…Sun=6
  })();

  const [streak, setStreak]         = useState(initialStreak);
  const [week, setWeek]             = useState<boolean[]>(
    initialWeek ?? Array(7).fill(false)
  );
  const [todayIndex, setTodayIndex] = useState(initialTodayIndex ?? clientTodayIndex);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fetch("/api/streak/checkin", {
      method: "POST",
      headers: { "x-timezone": tz },
    })
      .then((r) => r.ok ? r.json() as Promise<StreakData> : null)
      .then((data) => {
        if (data) {
          setStreak(data.streak);
          setWeek(data.week);
          setTodayIndex(data.todayIndex);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const todayName = DAY_NAMES[todayIndex] ?? "";

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0 text-base leading-none">
          🔥
        </div>
        <span className="text-sm font-medium text-gray-500">Daily Streak</span>
      </div>

      {/* Count */}
      <div>
        <p className="text-4xl font-bold tracking-tight flex items-center gap-2">
          🔥
          <span>{loading ? "—" : `${streak} day${streak !== 1 ? "s" : ""}`}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {streak === 0
            ? "Log in every day to build your streak."
            : streak < 7
            ? "Keep showing up — God honors your faithfulness."
            : streak < 30
            ? "You're on fire! Keep the momentum going."
            : "Incredible consistency. God sees every day of faithfulness."}
        </p>
      </div>

      {/* Week row */}
      <div className="flex items-end justify-between w-full mt-1">
        {DAY_LABELS.map((label, i) => {
          const checked  = week[i] ?? false;
          const isToday  = i === todayIndex;
          // future days (after today in the week) — never checked
          const isFuture = i > todayIndex;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="relative flex items-center justify-center">

                {/* Orange pulsing ring for today */}
                {isToday && (
                  <span
                    className="absolute inline-flex rounded-full opacity-40 animate-ping"
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#f97316",
                    }}
                  />
                )}

                <div
                  style={
                    isToday && checked
                      ? { backgroundColor: "#f97316", borderColor: "#f97316" }
                      : isToday && !checked
                      ? { borderColor: "#f97316" }
                      : {}
                  }
                  className={[
                    "relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors",
                    checked && !isToday
                      ? "bg-black border-black text-white"
                      : !checked && isToday
                      ? "bg-white text-black"
                      : !checked && !isFuture
                      ? "bg-gray-100 border-gray-200 text-gray-300"
                      : "bg-white border-gray-100 text-gray-200", // future
                  ].join(" ")}
                >
                  {checked ? (
                    <svg viewBox="0 0 12 10" className="w-3 h-3" aria-hidden>
                      <path
                        d="M1 5l3 3 7-7"
                        stroke={isToday ? "white" : "white"}
                        strokeWidth="1.8"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : isToday ? (
                    <span
                      className="w-2 h-2 rounded-full block"
                      style={{ backgroundColor: "#f97316" }}
                    />
                  ) : null}
                </div>
              </div>

              {/* Day label */}
              <span
                className="text-[10px] font-medium leading-none"
                style={isToday ? { color: "#f97316", fontWeight: 700 } : { color: "#9ca3af" }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Today label */}
      <p className="text-xs text-gray-400 -mt-1">
        Today:{" "}
        <span className="font-semibold" style={{ color: "#f97316" }}>
          {todayName}
        </span>
      </p>
    </div>
  );
}
