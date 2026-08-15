"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Radio, ArrowRight } from "lucide-react";
import { NEXT_ZOOM_CALL_DATE, NEXT_ZOOM_CALL_TITLE } from "@/lib/site-config";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

function getTimeLeft(): TimeLeft {
  const now = Date.now();
  const target = NEXT_ZOOM_CALL_DATE.getTime();
  const diff = target - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLive: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isLive: false };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function ZoomCountdownBar() {
  // Initialize to null to avoid SSR/hydration mismatch; populate after mount
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const tick = () => setTime(getTimeLeft());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (!time) return <div className="w-full bg-[#0a0a0a] h-[40px]" />;

  return (
    <div className="w-full bg-[#0a0a0a] text-white">
      <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between gap-4 min-h-[40px]">

        {/* Left — label */}
        <div className="flex items-center gap-2 shrink-0">
          <Radio size={13} className="text-white/50 shrink-0" />
          <span className="text-[10px] md:text-xs font-semibold tracking-[0.15em] uppercase text-white/80 hidden sm:block">
            {NEXT_ZOOM_CALL_TITLE}
          </span>
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-white/80 sm:hidden">
            NEXT LIVE CALL
          </span>
        </div>

        {/* Center — countdown */}
        {time.isLive ? (
          <div className="flex-1 flex justify-center">
            <span className="text-xs font-semibold tracking-widest text-white/90 uppercase animate-pulse">
              Live Now
            </span>
          </div>
        ) : (
          <>
            {/* Desktop countdown */}
            <div className="hidden sm:flex items-center gap-1.5 flex-1 justify-center">
              {[
                { value: pad(time.days), label: "DAYS" },
                { value: pad(time.hours), label: "HRS" },
                { value: pad(time.minutes), label: "MIN" },
                { value: pad(time.seconds), label: "SEC" },
              ].map((unit, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="flex flex-col items-center rounded px-2 py-0.5 min-w-[36px]">
                    <span className="text-sm font-bold tabular-nums leading-none text-white">
                      {unit.value}
                    </span>
                    <span className="text-[8px] font-medium text-white/40 tracking-widest mt-0.5">
                      {unit.label}
                    </span>
                  </div>
                  {i < 3 && (
                    <span className="text-white/30 text-xs font-bold">·</span>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile compact countdown */}
            <div className="sm:hidden flex-1 flex justify-center">
              <span className="text-xs font-semibold tabular-nums text-white/80">
                {pad(time.days)}d {pad(time.hours)}h {pad(time.minutes)}m
              </span>
            </div>
          </>
        )}

        {/* Right — CTA */}
        <Link
          href="/#membership"
          className="shrink-0 flex items-center gap-1 text-[10px] md:text-xs font-semibold text-white/60 hover:text-white transition-colors whitespace-nowrap"
        >
          <span className="hidden sm:inline">Join to Attend</span>
          <span className="sm:hidden">Join</span>
          <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}
