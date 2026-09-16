"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Play } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import {
  CHALLENGE_DAYS,
  TOTAL_CHALLENGE_DAYS,
  getChallengeDay,
} from "@/lib/challenge/days";
import type { ChallengeChecks, ChallengeProgress } from "@/lib/challenge/types";

const EMPTY_CHECKS: ChallengeChecks = {
  watched: false,
  recorded: false,
  posted: false,
};

function storageKey(userId: string | undefined) {
  return `ty-challenge-${userId ?? "guest"}`;
}

function loadProgress(userId: string | undefined): ChallengeProgress {
  if (typeof window === "undefined") return { completedDays: [], checks: {} };
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { completedDays: [], checks: {} };
    const parsed = JSON.parse(raw) as ChallengeProgress;
    return {
      completedDays: Array.isArray(parsed.completedDays) ? parsed.completedDays : [],
      checks: parsed.checks ?? {},
    };
  } catch {
    return { completedDays: [], checks: {} };
  }
}

function CopyBlock({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: string;
}) {
  const [copied, setCopied] = useState(false);
  const text = value.trim();

  const copy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400">
          {label}
        </p>
        <button
          type="button"
          onClick={copy}
          disabled={!text}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black disabled:opacity-40 disabled:hover:text-gray-500 transition-colors"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${text ? "text-gray-800" : "text-gray-400 italic"}`}>
        {text || empty || "Coming soon."}
      </p>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-4 py-3.5 border border-gray-200 bg-white text-left hover:border-gray-300 transition-colors"
    >
      <span
        className={`w-5 h-5 border flex items-center justify-center shrink-0 ${
          checked ? "bg-black border-black text-white" : "border-gray-300 bg-white"
        }`}
      >
        {checked ? <Check size={12} strokeWidth={3} /> : null}
      </span>
      <span className={`text-sm font-medium ${checked ? "text-black" : "text-gray-600"}`}>
        {label}
      </span>
    </button>
  );
}

export default function ChallengePage() {
  const { user, isDemo } = useUser();
  const userId = user?.id ?? (isDemo ? "demo-user" : undefined);

  const [selectedDay, setSelectedDay] = useState(1);
  const [progress, setProgress] = useState<ChallengeProgress>({
    completedDays: [],
    checks: {},
  });
  const [hydrated, setHydrated] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    setProgress(loadProgress(userId));
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!hydrated || !userId) return;
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(progress));
    } catch {
      /* ignore */
    }
  }, [progress, userId, hydrated]);

  useEffect(() => {
    setVideoFailed(false);
  }, [selectedDay]);

  const day = getChallengeDay(selectedDay);
  const checks = progress.checks[selectedDay] ?? EMPTY_CHECKS;
  const completedSet = useMemo(
    () => new Set(progress.completedDays),
    [progress.completedDays]
  );
  const completedCount = progress.completedDays.length;
  const percent = Math.round((completedCount / TOTAL_CHALLENGE_DAYS) * 100);
  const currentDay = Math.min(completedCount + 1, TOTAL_CHALLENGE_DAYS);
  const nextDay = selectedDay < TOTAL_CHALLENGE_DAYS ? getChallengeDay(selectedDay + 1) : null;
  const isComplete = completedSet.has(selectedDay);
  const showVideo = Boolean(day.videoUrl) && !videoFailed;

  const updateChecks = (patch: Partial<ChallengeChecks>) => {
    setProgress((prev) => ({
      ...prev,
      checks: {
        ...prev.checks,
        [selectedDay]: { ...(prev.checks[selectedDay] ?? EMPTY_CHECKS), ...patch },
      },
    }));
  };

  const markComplete = () => {
    setProgress((prev) => {
      const nextChecks = {
        ...prev.checks,
        [selectedDay]: { watched: true, recorded: true, posted: true },
      };
      const days = prev.completedDays.includes(selectedDay)
        ? prev.completedDays
        : [...prev.completedDays, selectedDay].sort((a, b) => a - b);
      return { completedDays: days, checks: nextChecks };
    });
    if (selectedDay < TOTAL_CHALLENGE_DAYS) {
      setSelectedDay(selectedDay + 1);
    }
  };

  return (
    <div className="pb-8">
      <div className="mb-6">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-2">
          Challenge
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          The Thank You Challenge 40
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          40 Days. 40 Videos. Build your outreach. Share Jesus.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl px-5 py-4 mb-6">
        <div className="flex items-end justify-between gap-4 mb-3">
          <p className="text-sm font-semibold tracking-tight">
            Day {currentDay} of {TOTAL_CHALLENGE_DAYS}
          </p>
          <p className="text-[11px] tracking-[0.14em] uppercase text-gray-400">
            {percent}% complete
          </p>
        </div>
        <div className="h-1.5 bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-black transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">
        <div className="space-y-5">
          <div className="bg-black rounded-2xl overflow-hidden">
            <div className="relative w-full max-w-[340px] mx-auto aspect-[9/16] bg-neutral-950">
              {showVideo ? (
                <video
                  key={day.day}
                  src={day.videoUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                  playsInline
                  onError={() => setVideoFailed(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-full border border-white/25 flex items-center justify-center mb-6">
                    <Play size={22} className="text-white ml-0.5" />
                  </div>
                  <p className="text-[11px] tracking-[0.22em] uppercase text-white/40 mb-2">
                    {day.status === "coming_up" ? "Coming Up" : "Today's Teaching"}
                  </p>
                  <p className="font-semibold text-white text-lg leading-tight">
                    Day {String(day.day).padStart(2, "0")}
                  </p>
                  <p className="text-sm text-white/45 mt-3 max-w-[200px] leading-relaxed">
                    Vertical teaching video will play here.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400">
                {day.label}
              </p>
              {day.status === "coming_up" && (
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase border border-gray-200 text-gray-500 px-2 py-0.5">
                  Coming Up
                </span>
              )}
              {isComplete && (
                <span className="text-[10px] font-semibold tracking-[0.14em] uppercase bg-black text-white px-2 py-0.5">
                  Complete
                </span>
              )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">
              {day.lessonTitle}
            </h2>
          </div>

          {day.scripture.text ? (
            <div className="bg-black text-white rounded-2xl p-6">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-white/40 mb-3">
                Scripture
              </p>
              <p className="font-serif italic text-lg leading-relaxed text-white/90">
                &ldquo;{day.scripture.text}&rdquo;
              </p>
              <p className="text-sm text-white/40 mt-4">— {day.scripture.reference}</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-2">
                Scripture
              </p>
              <p className="text-sm text-gray-400 italic">Scripture for this day is coming up.</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">
              Teaching
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">{day.teaching}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">
              Today's Post Prompt
            </p>
            <p className="text-xl font-serif italic leading-snug">{day.prompt}</p>
          </div>

          <CopyBlock label="Copyable Hook" value={day.hook} />
          <CopyBlock
            label="Caption"
            value={day.caption}
            empty="Caption for this day is coming up."
          />

          <div className="space-y-2">
            <CheckRow
              label="Watched Today's Teaching"
              checked={checks.watched}
              onToggle={() => updateChecks({ watched: !checks.watched })}
            />
            <CheckRow
              label="Recorded My Video"
              checked={checks.recorded}
              onToggle={() => updateChecks({ recorded: !checks.recorded })}
            />
            <CheckRow
              label="Posted My Message"
              checked={checks.posted}
              onToggle={() => updateChecks({ posted: !checks.posted })}
            />
          </div>

          <button
            type="button"
            onClick={markComplete}
            className="w-full inline-flex items-center justify-center gap-2 bg-black text-white font-semibold tracking-[0.12em] uppercase text-sm px-6 py-4 hover:bg-gray-900 transition-colors"
          >
            {isComplete ? "Day Complete" : "Mark Day Complete"}
            <ArrowRight size={16} />
          </button>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-4">
              Your 40-Day Progress
            </p>
            <div className="grid grid-cols-8 gap-1.5">
              {CHALLENGE_DAYS.map((d) => {
                const done = completedSet.has(d.day);
                const selected = d.day === selectedDay;
                const coming = d.status === "coming_up";
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d.day)}
                    title={`Day ${d.day}${coming ? " · Coming Up" : ""}`}
                    className={`aspect-square text-[10px] font-semibold flex items-center justify-center transition-colors ${
                      selected
                        ? "bg-black text-white"
                        : done
                        ? "bg-neutral-900 text-white"
                        : coming
                        ? "bg-gray-50 text-gray-300 border border-gray-100"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-black"
                    }`}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 text-[10px] tracking-[0.08em] uppercase text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-black" /> Done
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 border border-gray-300" /> Open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-gray-100 border border-gray-100" /> Coming Up
              </span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-2">
              Today's Action
            </p>
            <p className="text-sm font-medium leading-relaxed">
              Watch 5 minutes. Record 1 video. Post 1 message of hope.
            </p>
          </div>

          {nextDay && (
            <button
              type="button"
              onClick={() => setSelectedDay(nextDay.day)}
              className="w-full text-left bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors"
            >
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-gray-400 mb-2">
                Next Up
              </p>
              <p className="text-sm font-semibold">
                Day {String(nextDay.day).padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {nextDay.status === "coming_up" ? "Coming Up" : nextDay.title}
              </p>
            </button>
          )}

          <Link
            href="/dashboard/community"
            className="block w-full text-center border border-gray-200 bg-white px-5 py-3.5 text-sm font-medium hover:border-black transition-colors"
          >
            Need Encouragement?
          </Link>
        </aside>
      </div>
    </div>
  );
}
