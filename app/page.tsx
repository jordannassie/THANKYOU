"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle,
  Crown,
  Flame,
  Image,
  BookOpen,
  Users,
  Video,
  Menu,
  X,
  BookMarked,
} from "lucide-react";
import ZoomCountdownBar from "@/components/ZoomCountdownBar";
import Globe from "@/components/Globe";

const HERO_WORDS = ["receiving", "believing", "thanking"];

function HeroWord() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      // fade out
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % HERO_WORDS.length);
        setVisible(true);
      }, 400);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className="font-serif italic font-normal inline-block"
      style={{
        transition: "opacity 0.4s ease, transform 0.4s ease",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-8px)",
      }}
    >
      {" "}{HERO_WORDS[index]}
    </span>
  );
}
import {
  BOOKS,
  AMAZON_LOGO_URL,
  BOOK_AMAZON_URL,
  MEMBERSHIP_PRICE,
  MEMBERSHIP_FEATURES,
  NEXT_ZOOM_CALL_DATE,
  NEXT_ZOOM_CALL_TITLE,
  NEXT_ZOOM_CALL_URL,
} from "@/lib/site-config";

const features = [
  { icon: Image, title: "Vision Board", description: "Build a visual representation of what you're believing for." },
  { icon: Crown, title: "Thank You Declaration", description: "Put your future into words and see it every day." },
  { icon: Flame, title: "Daily Thank You", description: "Build a daily habit of gratitude and faith." },
  { icon: BookOpen, title: "Notes", description: "Write prayers, gratitude, reflections, and action steps." },
  { icon: Users, title: "Community", description: "Grow alongside others who are believing for their future." },
  { icon: Video, title: "Monthly Calls", description: "Join live encouragement, teaching, and accountability." },
];

function useCountdown(target: Date) {
  const [time, setTime] = useState({ days: 0, hours: 0, mins: 0, secs: 0, live: false });

  useEffect(() => {
    function tick() {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, mins: 0, secs: 0, live: true });
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTime({ days, hours, mins, secs, live: false });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return time;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const countdown = useCountdown(NEXT_ZOOM_CALL_DATE);

  // If Google OAuth redirected back to the home page instead of /auth/callback
  // (happens when Google Cloud Console has the wrong redirect URI registered),
  // forward the code to the correct callback route automatically.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code  = params.get("code");
    const error = params.get("error");
    if (code) {
      window.location.replace(`/auth/callback?code=${encodeURIComponent(code)}`);
    } else if (error) {
      window.location.replace(`/login?error=${encodeURIComponent(params.get("error_description") ?? error)}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Global Zoom Countdown Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <ZoomCountdownBar />

        {/* Navigation — sits below the bar */}
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/">
              <img
                src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Logo.png"
                alt="Thank You."
                className="h-16 w-auto object-contain"
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7">
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-black transition-colors font-medium">
                How It Works
              </a>
              <a href="#book" className="text-sm text-gray-600 hover:text-black transition-colors font-medium">
                Book
              </a>
              <a href="#membership" className="text-sm text-gray-600 hover:text-black transition-colors font-medium">
                Membership
              </a>
              <Link href="/login" className="text-sm text-gray-600 hover:text-black transition-colors font-medium">
                Sign In
              </Link>
              <Link
                href="/login"
                className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-gray-900 transition-colors"
              >
                Join Now
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-100 px-5 py-4 space-y-1">
              <a href="#how-it-works" className="block text-sm font-medium py-2.5" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
              <a href="#book" className="block text-sm font-medium py-2.5" onClick={() => setMobileMenuOpen(false)}>Book</a>
              <a href="#membership" className="block text-sm font-medium py-2.5" onClick={() => setMobileMenuOpen(false)}>Membership</a>
              <Link href="/login" className="block text-sm font-medium py-2.5" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              <Link
                href="/login"
                className="block w-full bg-black text-white text-sm font-medium px-5 py-3 rounded-xl text-center mt-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Join Now
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Spacer for fixed bar + nav (bar ~40px + nav ~65px) */}
      <div className="h-[105px]" />

      {/* Hero */}
      <section className="pt-20 pb-20 md:pt-28 md:pb-28 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-gray-400 tracking-widest uppercase mb-6">
            Receive. Believe. Thank.
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            See the future you are<br className="hidden sm:block" />
            <HeroWord /> God for...
          </h1>
          <p className="text-lg text-gray-500 mt-8 max-w-xl mx-auto leading-relaxed">
            Create your vision. Write it down. Give thanks. Keep believing. Watch what God does.
          </p>
          {/* Social proof — member avatars */}
          <div className="flex flex-col items-center gap-3 mt-10">
            <div className="flex items-center">
              {[
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&crop=face",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
              ].map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"
                  style={{ marginLeft: i === 0 ? 0 : "-10px", zIndex: 10 - i }}
                />
              ))}
              <div
                className="w-9 h-9 rounded-full border-2 border-white bg-black text-white flex items-center justify-center text-[10px] font-bold"
                style={{ marginLeft: "-10px", zIndex: 1 }}
              >
                +2k
              </div>
            </div>
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-black">2,000+ members</span> already seeing their vision come to pass
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link
              href="/login"
              className="bg-black text-white font-medium px-8 py-4 rounded-xl hover:bg-gray-900 transition-colors text-sm w-full sm:w-auto text-center"
            >
              Start Your Vision
            </Link>
            <Link
              href="/login"
              className="border border-gray-200 text-black font-medium px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors text-sm w-full sm:w-auto text-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-5 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-300/50 border border-gray-200">
            {/* Browser chrome bar */}
            <div className="bg-black text-white px-6 py-3.5 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <div className="flex-1 bg-white/10 rounded-lg px-3 py-1 text-xs text-white/50 text-center">
                thankyouway.com/dashboard
              </div>
            </div>
            {/* Real screenshot */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Dash.png"
              alt="Thank You dashboard"
              className="w-full block"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How It Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Receive It", desc: "See the future you are believing God for. Create a visual representation of what you have received in faith and keep it in front of you." },
              { step: "02", title: "Believe It", desc: "Return every day. Keep God's Word and your vision in front of you, and believe even before you see it come to pass." },
              { step: "03", title: "Thank God for It", desc: "Give thanks now for what you are believing God for. Walk in faith and trust Him with the how." },
            ].map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <p className="text-5xl font-bold text-black mb-4">{s.step}</p>
                <h3 className="text-2xl font-bold tracking-tight mb-3">— {s.title}</h3>
                <p className="text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need</h2>
            <p className="text-gray-500 mt-4 text-lg">to build and protect your vision.</p>
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 border border-gray-100 rounded-2xl hover:border-gray-200 transition-colors">
                  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                    <Icon size={18} className="text-white" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Book Section */}
      <section id="book" className="py-24 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase text-gray-400 mb-4">The Books</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Start with the books
            </h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Begin the journey with gratitude and daily devotion — then continue inside Thank You.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            {BOOKS.map((book) => (
              <div
                key={book.id}
                className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                  {/* Cover */}
                  <div className="relative shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={book.coverUrl}
                      alt={`${book.title} by Jordan Nassie`}
                      className="w-40 sm:w-36 md:w-40 rounded-2xl shadow-xl shadow-gray-300/40 object-cover"
                    />
                    <div className="absolute -bottom-1.5 -right-1.5 w-full h-full bg-gray-200 rounded-2xl -z-10" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3">
                      {book.title}
                    </h3>
                    <p className="text-gray-500 leading-relaxed text-sm mb-4">
                      {book.subtitle}
                    </p>
                    <p className="text-2xl font-bold mb-5">{book.price}</p>

                    <a
                      href={book.amazonUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-black text-white font-medium px-6 py-3.5 rounded-xl hover:bg-gray-900 transition-colors text-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={AMAZON_LOGO_URL}
                        alt="Amazon"
                        className="h-4 w-auto brightness-0 invert"
                      />
                      Get on Amazon
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Product ladder */}
          <div className="mt-12 pt-8 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {BOOKS.map((book) => (
              <div key={book.id} className="p-4 bg-white rounded-xl border border-gray-200 text-center sm:text-left">
                <p className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-1 truncate">
                  {book.title}
                </p>
                <p className="text-xl font-bold mb-1">{book.price}</p>
                <p className="text-xs text-gray-500">Begin the journey.</p>
              </div>
            ))}
            <div className="p-4 bg-black text-white rounded-xl text-center sm:text-left">
              <p className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-1">Membership</p>
              <div className="mb-1 flex items-baseline justify-center sm:justify-start gap-1.5">
                <span className="text-xs text-white/30 line-through">$299</span>
                <span className="text-xl font-bold">{MEMBERSHIP_PRICE}</span>
              </div>
              <p className="text-xs text-white/60">Live the journey every day.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-24 px-5 bg-black text-white">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm font-medium text-white/40 tracking-widest uppercase mb-4">Membership</p>
          <h2 className="text-4xl font-bold tracking-tight mb-2">Thank You. Membership</h2>
          <div className="mt-6 mb-2">
            <span className="text-lg text-white/35 line-through mr-2">$299/mo</span>
            <span className="text-5xl font-bold">$99</span><span className="text-2xl text-white/50">/mo</span>
          </div>
          <p className="text-sm font-semibold text-white/70 tracking-wide mb-1">Founding Member Price</p>
          <p className="text-xs text-white/40 mb-8">Lock in $99/month before we reach 1,000 members.</p>
          <ul className="space-y-3 text-left mb-8 max-w-xs mx-auto">
            {MEMBERSHIP_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <CheckCircle size={16} className="text-white/60 shrink-0" />
                <span className="text-white/80">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="inline-block w-full bg-white text-black font-medium py-4 rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            Join Thank You.
          </Link>
        </div>
      </section>

      {/* Live Call Countdown */}
      <section className="py-24 px-5" style={{ backgroundColor: "#2D8CFF" }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Left — text + countdown */}
            <div className="flex-1 text-center lg:text-left">
              {/* Zoom logo — inverted white */}
              <img
                src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Zoom-Logo.png"
                alt="Zoom"
                className="w-auto mb-8 mx-auto lg:mx-0 brightness-0 invert object-contain"
                style={{ height: "72px" }}
              />

              <p className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-3">Monthly Live Call</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">{NEXT_ZOOM_CALL_TITLE}</h2>
              <p className="text-white/70 text-sm mb-10">
                {NEXT_ZOOM_CALL_DATE.toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric", year: "numeric",
                })}
                {" · "}
                {NEXT_ZOOM_CALL_DATE.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })}
              </p>

              {/* Big countdown */}
              {countdown.live ? (
                <p className="text-4xl md:text-5xl font-bold text-white mb-10">Live Now</p>
              ) : (
                <div className="flex items-start justify-center lg:justify-start gap-3 md:gap-6 mb-10">
                  {[
                    { value: countdown.days, label: "DAYS" },
                    { value: countdown.hours, label: "HRS" },
                    { value: countdown.mins, label: "MINS" },
                    { value: countdown.secs, label: "SECS" },
                  ].map(({ value, label }, i) => (
                    <div key={label} className="flex items-start gap-3 md:gap-6">
                      <div className="text-center">
                        <p className="text-5xl md:text-7xl font-bold tabular-nums leading-none text-white">
                          {String(value).padStart(2, "0")}
                        </p>
                        <p className="text-[10px] font-semibold tracking-widest text-white/60 mt-2">{label}</p>
                      </div>
                      {i < 3 && (
                        <p className="text-4xl md:text-6xl font-light text-white/30 leading-none mt-1">:</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-white text-[#2D8CFF] font-semibold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-sm"
              >
                Join to Attend
                <ArrowRight size={15} />
              </Link>
              <p className="text-xs text-white/50 mt-3">
                Members only —{" "}
                <Link href="/login" className="underline hover:text-white transition-colors">
                  Join Thank You.
                </Link>{" "}
                to access live calls.
              </p>
            </div>

            {/* Right — Zoom screenshot */}
            <div className="flex-1 w-full lg:w-auto">
              <img
                src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/axx.png"
                alt="Thank You. Live Call"
                className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl shadow-blue-900/40"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Next Meetup — Globe */}
      <section className="py-24 px-5 bg-black text-white overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col-reverse lg:flex-row items-center gap-12">

            {/* Globe */}
            <div className="flex-1 w-full">
              <Globe />
            </div>

            {/* Copy */}
            <div className="flex-1 text-center lg:text-left">
              <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-4">Next Meetup</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                Dallas, TX
              </h2>
              <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <p className="text-white/60 text-sm">In-person gathering — coming soon</p>
              </div>
              <p className="text-white/50 leading-relaxed mb-8 max-w-md mx-auto lg:mx-0">
                Join Jordan and the Thank You. community for a live in-person event in Dallas, TX. A day of faith, vision, and gratitude — together.
              </p>

              <div className="inline-flex flex-col items-center lg:items-start gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-white text-black font-semibold px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors text-sm"
                >
                  Join the Waitlist
                  <ArrowRight size={15} />
                </Link>
                <p className="text-xs text-white/30">Members get first access.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-5 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Testimonials</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What members are saying</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Marcus T.",
                location: "Dallas, TX",
                avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
                text: "I wrote down that I would own a home by end of year and thanked God for it every day. Closed on my house 4 months later. This app is not a game.",
              },
              {
                name: "Aaliyah M.",
                location: "Charlotte, NC",
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face",
                text: "Got my promotion 6 weeks after putting it on my vision board. God is not slow.",
              },
              {
                name: "Carlos R.",
                location: "Miami, FL",
                avatar: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&crop=face",
                text: "I was asking God but not thanking Him in advance. That one shift changed everything for my business. Revenue doubled in 90 days.",
              },
              {
                name: "Priya S.",
                location: "Houston, TX",
                avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face",
                text: "The community keeps me accountable. There is something powerful about declaring your vision in a group of believers. I look forward to the Zoom calls every month.",
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <svg key={s} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-28 px-5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            What are you believing<br />God for?
          </h2>
          <p className="text-gray-500 mt-6 text-lg leading-relaxed max-w-xl mx-auto">
            Start seeing it. Start thanking God for it. Start becoming the person who can receive it.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-black text-white font-medium px-8 py-4 rounded-xl hover:bg-gray-900 transition-colors text-sm mt-10"
          >
            Create My Vision
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Statement of Faith */}
      <section className="py-20 px-5 bg-gray-100 text-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full border border-gray-300 bg-white mx-auto mb-5">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-6">Statement of Faith</p>
          <div className="space-y-5 text-gray-600 text-base leading-relaxed">
            <p>We believe in <span className="text-gray-900 font-semibold">one God — Father, Son, and Holy Spirit.</span></p>
            <p>We believe <span className="text-gray-900 font-semibold">Jesus Christ is the Son of God</span>, who died for our sins, rose from the dead, and is the only way to salvation.</p>
            <p>We believe the <span className="text-gray-900 font-semibold">Bible is the inspired Word of God</span> and the foundation for our faith and life.</p>
            <p>We believe salvation is a <span className="text-gray-900 font-semibold">gift of God&apos;s grace</span>, received through faith in Jesus Christ.</p>
            <p>We believe in the <span className="text-gray-900 font-semibold">power of prayer, the work of the Holy Spirit, and the hope of eternal life with God.</span></p>
          </div>
          <p className="mt-10 text-2xl font-serif font-semibold text-gray-900 tracking-wide italic">Jesus is King.</p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-px w-16 bg-gray-300" />
            <span className="text-gray-400 text-xs">✦</span>
            <div className="h-px w-16 bg-gray-300" />
          </div>
        </div>
      </section>

      {/* Jordan Nassie — About the Author */}
      <section className="py-24 px-5 bg-gray-50 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-14">

            {/* Photo collage */}
            <div className="shrink-0 w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto lg:max-w-none lg:w-[380px]">
                {/* Left column — tall portrait */}
                <div className="row-span-2">
                  <img
                    src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Jordan%20Profile.PNG"
                    alt="Jordan Nassie"
                    className="w-full h-full object-cover object-top rounded-2xl shadow-md"
                    style={{ minHeight: "280px", maxHeight: "380px" }}
                  />
                </div>
                {/* Right column — two stacked photos */}
                <div className="flex flex-col gap-3">
                  <img
                    src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Jands.jpg"
                    alt="Jordan and Susie"
                    className="w-full h-40 object-cover object-center rounded-2xl shadow-md"
                  />
                  <img
                    src="https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/susie.png"
                    alt="Jordan and Susie Nassie"
                    className="w-full h-40 object-cover object-top rounded-2xl shadow-md"
                  />
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="text-center lg:text-left">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">About the Founder</p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">Jordan Nassie</h2>
              <p className="text-gray-500 leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                Jordan Nassie is a faith-driven entrepreneur, speaker, and author who believes every God-given dream deserves to be seen, spoken, and thanked for before it arrives. Through the Thank You. book and membership, Jordan helps people build a daily practice of faith, vision, and gratitude.
              </p>

              <a
                href={BOOK_AMAZON_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-black text-white font-medium px-6 py-3.5 rounded-xl hover:bg-gray-900 transition-colors text-sm"
              >
                <img
                  src={AMAZON_LOGO_URL}
                  alt="Amazon"
                  className="h-5 brightness-0 invert"
                />
                Get the Book on Amazon
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div>
              <p className="text-base font-bold">Thank You.</p>
              <p className="text-sm text-gray-400 mt-1">Receive. Believe. Thank.</p>

              {/* Social icons */}
              <div className="flex items-center gap-4 mt-5">
                {/* Instagram */}
                <a
                  href="https://www.instagram.com/thankyougroups"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
                  </svg>
                </a>
                {/* Facebook */}
                <a
                  href="https://www.facebook.com/thankyougroups/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-5">
              {[
                { label: "Home", href: "/" },
                { label: "Book", href: "#book" },
                { label: "Membership", href: "#membership" },
                { label: "Sign In", href: "/login" },
                { label: "Terms", href: "#" },
                { label: "Privacy", href: "#" },
                { label: "Admin", href: "/admin" },
              ].map((link) => (
                <a key={link.label} href={link.href} className="text-sm text-gray-400 hover:text-black transition-colors">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-300 mt-8 text-center md:text-left">
            © {new Date().getFullYear()} Thank You. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
