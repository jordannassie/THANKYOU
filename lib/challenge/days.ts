import type { ChallengeDay } from "./types";

const VIDEO = (day: number) =>
  `https://cdn.thankyouway.com/challenge/vertical/day-${String(day).padStart(2, "0")}.mp4`;

const READY_DAYS: ChallengeDay[] = [
  {
    day: 1,
    status: "ready",
    phase: "Foundation",
    title: "You Already Have a Story",
    label: "DAY 01 · YOU ALREADY HAVE A STORY",
    lessonTitle: "You Don't Need a Pulpit. You Already Have a Phone.",
    videoUrl: VIDEO(1),
    scripture: {
      reference: "Psalm 107:2",
      text: "Let the redeemed of the Lord tell their story—those he redeemed from the hand of the foe.",
    },
    teaching:
      "You do not need a stage, a title, or a polished testimony. If God has done something in your life, you already have a story. A phone in your hand is enough to encourage someone today.",
    prompt: "One thing I'm thanking God for today is…",
    hook: "I almost didn't share this, but someone may need to hear it…",
    caption:
      "One thing I'm thanking God for today is His faithfulness when I did not have the words. You don't need a pulpit. If you have a phone and a story of what God has done, you already have a way to encourage someone.\n\n#ThankYouChallenge40",
  },
  {
    day: 2,
    status: "ready",
    phase: "Foundation",
    title: "Your First Thank You Video",
    label: "DAY 02 · YOUR FIRST THANK YOU VIDEO",
    lessonTitle: "Keep It Simple. One Sentence of Thanks Is Enough.",
    videoUrl: VIDEO(2),
    scripture: {
      reference: "1 Thessalonians 5:18",
      text: "Give thanks in all circumstances; for this is God's will for you in Christ Jesus.",
    },
    teaching:
      "Your first video does not have to be impressive. Look at the camera. Thank God for one specific thing. Then post it. Outreach begins with a simple, honest word of thanks.",
    prompt: "Today I want to thank God out loud for…",
    hook: "This is my first thank-you video, and I'm posting it anyway…",
    caption:
      "This is my first thank-you video. I'm not trying to perform. I'm just thanking God out loud and hoping it encourages someone who needed to hear it today.\n\n#ThankYouChallenge40",
  },
  {
    day: 3,
    status: "ready",
    phase: "Foundation",
    title: "Who Are You Called to Encourage?",
    label: "DAY 03 · WHO ARE YOU CALLED TO ENCOURAGE?",
    lessonTitle: "Outreach Starts With a Person, Not an Audience.",
    videoUrl: VIDEO(3),
    scripture: {
      reference: "2 Corinthians 1:4",
      text: "Who comforts us in all our troubles, so that we can comfort those in any trouble with the comfort we ourselves receive from God.",
    },
    teaching:
      "Do not aim at the internet. Aim at a person. Who is tired, lonely, or far from God? Speak as if they are the only one watching. That is how hope travels.",
    prompt: "The person I want to encourage this week is…",
    hook: "If you're carrying something heavy today, this is for you…",
    caption:
      "If you're carrying something heavy today, this is for you. God has comforted me, and I will not keep that comfort to myself. You are not forgotten.\n\n#ThankYouChallenge40",
  },
  {
    day: 4,
    status: "ready",
    phase: "Foundation",
    title: "Stop Waiting to Feel Ready",
    label: "DAY 04 · STOP WAITING TO FEEL READY",
    lessonTitle: "Faithfulness Beats Polish.",
    videoUrl: VIDEO(4),
    scripture: {
      reference: "2 Timothy 1:7",
      text: "For the Spirit God gave us does not make us timid, but gives us power, love and self-discipline.",
    },
    teaching:
      "Waiting to feel ready is often just fear wearing patience as a disguise. God did not ask you to be impressive. He asked you to be faithful. Record the video before the excuse finishes its sentence.",
    prompt: "I've been waiting to feel ready to share this…",
    hook: "I kept waiting to feel ready. Then I remembered who sent me…",
    caption:
      "I kept waiting to feel ready. Then I remembered who sent me. If God has put hope in you, do not wait for perfect lighting to share it.\n\n#ThankYouChallenge40",
  },
  {
    day: 5,
    status: "ready",
    phase: "Foundation",
    title: "Build Your 40-Day Rhythm",
    label: "DAY 05 · BUILD YOUR 40-DAY RHYTHM",
    lessonTitle: "Watch. Record. Post. Repeat.",
    videoUrl: VIDEO(5),
    scripture: {
      reference: "Galatians 6:9",
      text: "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    },
    teaching:
      "Forty days is not a talent contest. It is a rhythm. Watch the teaching. Record one video. Post one message of hope. Do it again tomorrow. That is how an outreach is built.",
    prompt: "The rhythm I will keep for the next 40 days is…",
    hook: "I'm not trying to go viral. I'm trying to be faithful for 40 days…",
    caption:
      "I'm not trying to go viral. I'm trying to be faithful for 40 days — watch, record, and post one message of hope. If you're walking with me, start today.\n\n#ThankYouChallenge40",
  },
];

function comingUp(day: number): ChallengeDay {
  const phase =
    day <= 10 ? "Foundation" : day <= 20 ? "Story" : day <= 30 ? "Outreach" : "Invite";

  return {
    day,
    status: "coming_up",
    phase,
    title: `Day ${day}`,
    label: `DAY ${String(day).padStart(2, "0")} · COMING UP`,
    lessonTitle: "This day's teaching is being prepared.",
    videoUrl: VIDEO(day),
    scripture: {
      reference: "",
      text: "",
    },
    teaching:
      "This lesson will be released as The Thank You Challenge 40 continues. You can still open the day, prepare your heart, and keep your outreach rhythm.",
    prompt: "One thing I'm thanking God for today is…",
    hook: "I almost didn't share this, but someone may need to hear it…",
    caption: "",
  };
}

export const TOTAL_CHALLENGE_DAYS = 40;

export const CHALLENGE_DAYS: ChallengeDay[] = [
  ...READY_DAYS,
  ...Array.from({ length: TOTAL_CHALLENGE_DAYS - READY_DAYS.length }, (_, i) =>
    comingUp(i + READY_DAYS.length + 1)
  ),
];

export function getChallengeDay(day: number): ChallengeDay {
  return CHALLENGE_DAYS.find((d) => d.day === day) ?? CHALLENGE_DAYS[0];
}
