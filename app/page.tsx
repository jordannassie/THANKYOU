"use client";

import Link from "next/link";
import { useState } from "react";
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
import {
  BOOK_TITLE,
  BOOK_SUBTITLE,
  BOOK_PRICE,
  BOOK_AMAZON_URL,
  MEMBERSHIP_PRICE,
  MEMBERSHIP_FEATURES,
} from "@/lib/site-config";

const features = [
  { icon: Image, title: "Vision Board", description: "Build a visual representation of what you're believing for." },
  { icon: Crown, title: "Dream Declaration", description: "Put your future into words and see it every day." },
  { icon: Flame, title: "Daily Thank You", description: "Build a daily habit of gratitude and faith." },
  { icon: BookOpen, title: "Notes", description: "Write prayers, gratitude, reflections, and action steps." },
  { icon: Users, title: "Community", description: "Grow alongside others who are believing for their future." },
  { icon: Video, title: "Monthly Calls", description: "Join live encouragement, teaching, and accountability." },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Global Zoom Countdown Bar */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <ZoomCountdownBar />

        {/* Navigation — sits below the bar */}
        <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Thank You.
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
            See it. Believe it. Receive it.
          </p>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
            See the future you are<br className="hidden sm:block" />
            <span className="font-serif italic font-normal"> believing God for.</span>
          </h1>
          <p className="text-lg text-gray-500 mt-8 max-w-xl mx-auto leading-relaxed">
            Create your vision. Write it down. Give thanks. Keep believing. Watch what God does.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
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
          <div className="bg-gray-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl shadow-gray-200/60">
            <div className="bg-black text-white px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
                <div className="w-3 h-3 rounded-full bg-white/20" />
              </div>
              <div className="flex-1 bg-white/10 rounded-lg px-3 py-1 text-xs text-white/50 text-center">
                thankyou.app/dashboard
              </div>
            </div>
            <div className="flex min-h-[500px]">
              <div className="hidden sm:flex w-44 bg-black text-white flex-col px-4 py-5 shrink-0">
                <p className="text-sm font-bold mb-1">Thank You.</p>
                <p className="text-[9px] text-white/40 mb-5">See it. Believe it. Receive it.</p>
                {["Dashboard", "Vision Board", "Notes", "Community", "Account"].map((item, i) => (
                  <div key={item} className={`text-xs px-2 py-2 rounded-lg mb-0.5 ${i === 0 ? "bg-white text-black font-medium" : "text-white/50"}`}>
                    {item}
                  </div>
                ))}
              </div>
              <div className="flex-1 p-5 overflow-hidden">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                  <div className="bg-white rounded-xl p-4 border border-gray-100 col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" alt="User" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400">Welcome back,</p>
                        <p className="text-xs font-bold">Jordan</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 leading-relaxed">Nothing is impossible with God.</p>
                    <p className="text-[9px] font-semibold">What a man believes, he becomes.</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><Flame size={10} className="text-white" /></div>
                      <span className="text-[9px] text-gray-500">Daily Streak</span>
                    </div>
                    <p className="text-xl font-bold">47 days</p>
                    <p className="text-[9px] text-gray-400 mt-1">God honors your faithfulness.</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 bg-black rounded-full flex items-center justify-center"><Crown size={9} className="text-white" /></div>
                      <span className="text-[9px] text-gray-500">Premium</span>
                    </div>
                    <p className="text-xl font-bold">{MEMBERSHIP_PRICE}</p>
                    <p className="text-[9px] text-gray-400 mt-1">Monthly Live Calls</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-[9px] text-gray-500 mb-2">Next Live Call</p>
                    <div className="flex gap-1">
                      {["22", "05", "18"].map((v, i) => (
                        <div key={i} className="text-center">
                          <p className="text-sm font-bold">{v}</p>
                          <p className="text-[7px] text-gray-400">{["D", "H", "M"][i]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-2">Dream Declaration</p>
                  <p className="font-serif text-base md:text-lg font-medium">Thank you God I will be a billionaire</p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=200&h=150&fit=crop",
                    "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=200&h=150&fit=crop",
                    "https://images.unsplash.com/photo-1439130490301-25e322d88054?w=200&h=150&fit=crop",
                    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&h=150&fit=crop",
                    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=200&h=150&fit=crop",
                  ].map((url, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Book Cover */}
            <div className="flex justify-center md:justify-end">
              <div className="relative">
                <div className="w-56 h-72 md:w-64 md:h-80 bg-black rounded-2xl shadow-2xl shadow-gray-400/30 flex flex-col items-center justify-center p-8">
                  <p className="text-white/30 text-xs tracking-[0.3em] uppercase mb-4">Thank You.</p>
                  <div className="w-full h-px bg-white/20 mb-6" />
                  <BookMarked size={32} className="text-white/50 mb-4" />
                  <p className="font-serif text-white text-xl font-medium text-center leading-snug">
                    365<br />Thank You.
                  </p>
                  <div className="w-full h-px bg-white/20 mt-6 mb-3" />
                  <p className="text-white/30 text-[10px] tracking-widest uppercase">{BOOK_PRICE}</p>
                </div>
                {/* Subtle shadow/depth */}
                <div className="absolute -bottom-2 -right-2 w-56 md:w-64 h-72 md:h-80 bg-gray-200 rounded-2xl -z-10" />
              </div>
            </div>

            {/* Book Info */}
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-gray-400 mb-4">The Book</p>
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
                {BOOK_TITLE}
              </h2>
              <p className="text-gray-500 leading-relaxed text-lg mb-6">
                {BOOK_SUBTITLE}
              </p>
              <p className="text-3xl font-bold mb-8">{BOOK_PRICE}</p>

              <a
                href={BOOK_AMAZON_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-black text-white font-medium px-7 py-4 rounded-xl hover:bg-gray-900 transition-colors text-sm"
              >
                Get the Book on Amazon
                <ArrowRight size={15} />
              </a>

              <p className="text-sm text-gray-400 mt-5 leading-relaxed">
                Start with the book. Continue the journey inside Thank You.
              </p>

              {/* Product ladder */}
              <div className="mt-8 pt-8 border-t border-gray-200 grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold tracking-wider uppercase text-gray-400 mb-1">The Book</p>
                  <p className="text-xl font-bold mb-1">{BOOK_PRICE}</p>
                  <p className="text-xs text-gray-500">Begin the journey.</p>
                </div>
                <div className="p-4 bg-black text-white rounded-xl">
                  <p className="text-xs font-semibold tracking-wider uppercase text-white/40 mb-1">Membership</p>
                  <p className="text-xl font-bold mb-1">{MEMBERSHIP_PRICE}</p>
                  <p className="text-xs text-white/60">Live the journey every day.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Membership */}
      <section id="membership" className="py-24 px-5 bg-black text-white">
        <div className="max-w-md mx-auto text-center">
          <p className="text-sm font-medium text-white/40 tracking-widest uppercase mb-4">Membership</p>
          <h2 className="text-4xl font-bold tracking-tight mb-2">Thank You. Membership</h2>
          <p className="text-5xl font-bold mt-6 mb-8">
            $99<span className="text-2xl text-white/50">/mo</span>
          </p>
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div>
              <p className="text-base font-bold">Thank You.</p>
              <p className="text-sm text-gray-400 mt-1">See it. Believe it. Receive it.</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              {[
                { label: "Home", href: "/" },
                { label: "Book", href: "#book" },
                { label: "Membership", href: "#membership" },
                { label: "Sign In", href: "/login" },
                { label: "Terms", href: "#" },
                { label: "Privacy", href: "#" },
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
