import { Flame } from "lucide-react";
import { mockStreak } from "@/lib/mock-data";

export default function StreakCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <Flame size={16} className="text-white" />
        </div>
        <span className="text-sm font-medium text-gray-500">Daily Streak</span>
      </div>
      <div>
        <p className="text-4xl font-bold tracking-tight">{mockStreak.days} days</p>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Keep showing up.<br />God honors your faithfulness.
        </p>
      </div>
      <div className="flex items-center gap-2 mt-1">
        {mockStreak.weekLabels.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                mockStreak.currentWeek[i]
                  ? "bg-black border-black text-white"
                  : "bg-white border-gray-200 text-gray-400"
              }`}
            >
              {mockStreak.currentWeek[i] ? "✓" : ""}
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
