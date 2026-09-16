export type ChallengeDayStatus = "ready" | "coming_up";

export interface ChallengeScripture {
  reference: string;
  text: string;
}

export interface ChallengeDay {
  day: number;
  status: ChallengeDayStatus;
  phase: string;
  title: string;
  label: string;
  lessonTitle: string;
  videoUrl: string;
  scripture: ChallengeScripture;
  teaching: string;
  prompt: string;
  hook: string;
  caption: string;
}

export interface ChallengeChecks {
  watched: boolean;
  recorded: boolean;
  posted: boolean;
}

export interface ChallengeProgress {
  completedDays: number[];
  checks: Record<number, ChallengeChecks>;
}
