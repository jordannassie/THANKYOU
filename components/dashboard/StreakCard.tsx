"use client";

import { Flame } from "lucide-react";
import { mockStreak } from "@/lib/mock-data";

// mockStreak.currentWeek is indexed Mon=0 … Sun=6
// JS Date.getDay() returns Sun=0, Mon=1 … Sat=6
function mockIndexForToday(): number {
  const jsDay = new Date().getDay(); // 0=Sun … 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1; // convert to Mon=0 … Sun=6
}

export default function StreakCard() {
  const todayMockIndex = mockIndexForToday();

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-3 overflow-hidden">
      {/* Title */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shrink-0">
          <Flame size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">Daily Streak</span>
      </div>

      {/* Count */}
      <div>
        <p className="text-4xl font-bold tracking-tight">{mockStreak.days} days</p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Keep showing up.<br />God honors your faithfulness.
        </p>
      </div>

      {/* Week row — justify-between prevents overflow at any card width */}
      <div className="flex items-end justify-between w-full mt-1">
        {mockStreak.weekLabels.map((label, i) => {
          const completed = mockStreak.currentWeek[i];
          const isToday   = i === todayMockIndex;

          return (
            <div key={i} className="flex flex-col items-center gap-1">
              {/* Dot */}
              <div className="relative flex items-center justify-center">
                {/* Animated ping ring for today */}
                {isToday && (
                  <span className="absolute inline-flex w-full h-full rounded-full bg-black opacity-20 animate-ping" />
                )}

                <div
                  className={`
                    relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors
                    ${completed
                      ? "bg-black border-black text-white"
                      : isToday
                      ? "bg-white border-black text-black"
                      : "bg-white border-gray-200 text-gray-300"
                    }
                  `}
                >
                  {completed ? (
                    <svg viewBox="0 0 12 10" className="w-3 h-3 fill-white" aria-hidden>
                      <path d="M1 5l3 3 7-7" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isToday ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-black block" />
                  ) : null}
                </div>
              </div>

              {/* Day label */}
              <span
                className={`text-[10px] font-medium leading-none ${
                  isToday ? "text-black font-bold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Today label */}
      <p className="text-xs text-gray-400 -mt-1">
        Today: <span className="text-black font-semibold">{["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][todayMockIndex]}</span>
      </p>
    </div>
  );
}
