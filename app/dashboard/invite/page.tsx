"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Copy,
  Check,
  Mail,
  MessageSquare,
  Globe2,
  Share2,
  Users,
  Network,
  MapPin,
  ChevronRight,
  Heart,
} from "lucide-react";

// Inline brand icons (lucide-react drops social brand icons)
function IconFacebook({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function IconX({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
import { useUser } from "@/components/providers/UserProvider";
import type { InviteStats } from "@/app/api/invite/stats/route";
import type { GlobalStats } from "@/app/api/invite/global/route";

// ── Country flag helper ────────────────────────────────────────────────
const FLAG_BASE = 0x1F1E6 - 65; // regional indicator offset
function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "🌍";
  const [a, b] = code.toUpperCase().split("");
  return String.fromCodePoint(FLAG_BASE + a.charCodeAt(0)) +
         String.fromCodePoint(FLAG_BASE + b.charCodeAt(0));
}

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", GB: "United Kingdom", CA: "Canada", AU: "Australia",
  NG: "Nigeria", GH: "Ghana", ZA: "South Africa", KE: "Kenya", UG: "Uganda",
  IN: "India", PH: "Philippines", MX: "Mexico", BR: "Brazil", DE: "Germany",
  FR: "France", SG: "Singapore", NZ: "New Zealand", AE: "United Arab Emirates",
  HK: "Hong Kong", JM: "Jamaica", TT: "Trinidad & Tobago",
};

// ── Main page ──────────────────────────────────────────────────────────
export default function InvitePage() {
  const { user, profile, isDemo } = useUser();

  const [stats, setStats] = useState<InviteStats | null>(null);
  const [global, setGlobal] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"my-invites" | "my-network" | "global">("my-invites");

  // Derive invite URL
  const BASE_URL =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://thankyoupower.netlify.app";

  const inviteCode = stats?.invite_code ?? profile?.invite_code ?? null;
  const inviteUrl = inviteCode ? `${BASE_URL}/join?ref=${inviteCode}` : null;

  const fetchData = useCallback(async () => {
    if (isDemo) {
      // Show plausible demo data
      setStats({
        invite_code: "demo1234",
        direct_invites: 3,
        total_network: 8,
        max_depth: 2,
        countries_reached: 2,
        direct_members: [
          { id: "d1", first_name: "Sarah", avatar_url: null, country_code: "US", joined_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { id: "d2", first_name: "Michael", avatar_url: null, country_code: "GB", joined_at: new Date(Date.now() - 86400000 * 7).toISOString() },
          { id: "d3", first_name: "Priya", avatar_url: null, country_code: "IN", joined_at: new Date(Date.now() - 86400000 * 14).toISOString() },
        ],
        network_countries: [
          { country_code: "US", member_count: 5 },
          { country_code: "GB", member_count: 2 },
          { country_code: "IN", member_count: 1 },
        ],
      });
      setGlobal({ total_members: 247, total_countries: 12, top_countries: [] });
      setLoading(false);
      return;
    }

    try {
      const [statsRes, globalRes] = await Promise.all([
        fetch("/api/invite/stats"),
        fetch("/api/invite/global"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (globalRes.ok) setGlobal(await globalRes.json());
    } catch (e) {
      console.error("invite fetch error", e);
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Copy handler ─────────────────────────────────────────────────────
  const handleCopy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ── Web Share API ────────────────────────────────────────────────────
  const handleNativeShare = () => {
    if (!inviteUrl) return;
    navigator.share?.({
      title: "Join the Thank You Movement",
      text: "I've been growing in gratitude and faith with Thank You. — come join me!",
      url: inviteUrl,
    });
  };
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  // ── Share URLs ───────────────────────────────────────────────────────
  const shareText = encodeURIComponent("Join me on Thank You. — a community believing for their futures together.");
  const shareLinks = {
    whatsapp: `https://wa.me/?text=${shareText}%20${encodeURIComponent(inviteUrl ?? "")}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl ?? "")}`,
    twitter: `https://twitter.com/intent/tweet?text=${shareText}&url=${encodeURIComponent(inviteUrl ?? "")}`,
    email: `mailto:?subject=${encodeURIComponent("You're invited to Thank You.")}&body=${shareText}%20${encodeURIComponent(inviteUrl ?? "")}`,
    sms: `sms:?body=${shareText}%20${encodeURIComponent(inviteUrl ?? "")}`,
  };

  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Friend";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasInvites = (stats?.direct_invites ?? 0) > 0;

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* ── Global Movement Counter ────────────────────────────────── */}
      <div className="bg-black text-white px-5 py-12 text-center">
        <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-3">
          Global Movement
        </p>
        <div className="flex items-end justify-center gap-6 mb-2">
          <div className="text-center">
            <p className="text-5xl md:text-6xl font-bold tracking-tight tabular-nums">
              {(global?.total_members ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-white/60 mt-1">People</p>
          </div>
          <div className="text-white/30 text-2xl mb-3">·</div>
          <div className="text-center">
            <p className="text-5xl md:text-6xl font-bold tracking-tight tabular-nums">
              {global?.total_countries ?? 0}
            </p>
            <p className="text-sm text-white/60 mt-1">Countries</p>
          </div>
        </div>
        <p className="text-white/50 text-sm mt-4">Growing the Thank You Movement</p>
        <div className="mt-6 w-12 border-t border-white/20 mx-auto" />
        <p className="text-white/30 text-xs mt-4 italic tracking-wide">
          Receive. Believe. Thank.
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10 space-y-10">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black">
            Grow the Thank You Movement
          </h1>
          <p className="text-gray-500 mt-2 text-base">
            Invite someone to believe for their future with you, {firstName}.
          </p>
          <p className="text-black font-semibold mt-3 text-sm">
            One Thank You can change a life. One invitation can start a movement.
          </p>
        </div>

        {/* ── Invite Link Card ─────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Your Personal Invite Link
          </p>

          {inviteUrl ? (
            <>
              {/* URL display */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4 overflow-hidden">
                <p className="text-sm text-gray-700 flex-1 truncate font-mono">{inviteUrl}</p>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-black text-white hover:bg-gray-800 active:scale-[0.98]"
                }`}
              >
                {copied ? (
                  <><Check size={16} /> Copied!</>
                ) : (
                  <><Copy size={16} /> Copy Invite Link</>
                )}
              </button>

              {/* Share buttons */}
              <div className="mt-5">
                <p className="text-xs text-gray-400 font-medium mb-3">Share via</p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare size={13} />
                    WhatsApp
                  </a>
                  <a
                    href={shareLinks.sms}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <MessageSquare size={13} />
                    Text
                  </a>
                  <a
                    href={shareLinks.email}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Mail size={13} />
                    Email
                  </a>
                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <IconFacebook size={13} />
                    Facebook
                  </a>
                  <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <IconX size={13} />X
                  </a>
                  {canNativeShare && (
                    <button
                      onClick={handleNativeShare}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-black text-white text-xs font-medium hover:bg-gray-800 transition-colors"
                    >
                      <Share2 size={13} />
                      Share
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm">Generating your invite link…</p>
            </div>
          )}
        </div>

        {/* ── Impact Stats ─────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
            Your Impact
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Invited",
                value: stats?.direct_invites ?? 0,
                icon: <Users size={16} />,
                desc: "People you've invited",
              },
              {
                label: "Network",
                value: stats?.total_network ?? 0,
                icon: <Network size={16} />,
                desc: "Total in your network",
              },
              {
                label: "Countries",
                value: stats?.countries_reached ?? 0,
                icon: <Globe2 size={16} />,
                desc: "Countries reached",
              },
              {
                label: "Generations",
                value: stats?.max_depth ?? 0,
                icon: <ChevronRight size={16} />,
                desc: "Movement depth",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="border border-gray-200 rounded-2xl p-4 text-center"
              >
                <div className="flex items-center justify-center text-gray-400 mb-2">
                  {s.icon}
                </div>
                <p className="text-3xl font-bold tracking-tight text-black">
                  {s.value}
                </p>
                <p className="text-xs text-gray-400 mt-1 leading-tight">{s.desc}</p>
              </div>
            ))}
          </div>

          {!hasInvites && (
            <div className="mt-5 bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center">
              <p className="text-base font-semibold text-black">It Starts With You.</p>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Invite one person. They invite another. Together, we can spread Thank You around the world.
              </p>
            </div>
          )}
        </div>

        {/* ── Network Tabs ─────────────────────────────────────────── */}
        <div>
          <div className="flex gap-1 border border-gray-200 rounded-xl p-1 mb-5">
            {(["my-invites", "my-network", "global"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === tab
                    ? "bg-black text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "my-invites" ? "My Invites" : tab === "my-network" ? "My Network" : "Global"}
              </button>
            ))}
          </div>

          {/* ── My Invites tab ──────────────────────────────────── */}
          {activeTab === "my-invites" && (
            <div>
              {(stats?.direct_members?.length ?? 0) === 0 ? (
                <EmptyInvitesState />
              ) : (
                <div className="space-y-2">
                  {stats!.direct_members.map((m) => (
                    <MemberRow key={m.id} member={m} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── My Network tab ──────────────────────────────────── */}
          {activeTab === "my-network" && (
            <NetworkView stats={stats} />
          )}

          {/* ── Global tab ──────────────────────────────────────── */}
          {activeTab === "global" && (
            <GlobalView global={global} />
          )}
        </div>

        {/* ── Country List ─────────────────────────────────────────── */}
        {activeTab !== "global" && (stats?.network_countries?.length ?? 0) > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
              Your Movement Around the World
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stats!.network_countries.map((c) => (
                <div
                  key={c.country_code}
                  className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{countryFlag(c.country_code)}</span>
                    <span className="text-sm font-medium text-gray-800">
                      {COUNTRY_NAMES[c.country_code] ?? c.country_code}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-black">
                    {c.member_count} {c.member_count === 1 ? "person" : "people"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Movement Message ─────────────────────────────────────── */}
        <div className="text-center py-8 border-t border-gray-100">
          <Heart size={20} className="text-gray-300 mx-auto mb-4" />
          <p className="text-base font-semibold text-gray-800">
            One Thank You can change a life.
            <br />One invitation can start a movement.
          </p>
          <p className="text-sm text-gray-400 mt-2 tracking-wide">Receive. Believe. Thank.</p>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function MemberRow({
  member,
}: {
  member: {
    id: string;
    first_name: string;
    avatar_url: string | null;
    country_code: string | null;
    joined_at: string;
  };
}) {
  const initials = member.first_name[0]?.toUpperCase() ?? "M";
  const joinedDate = new Date(member.joined_at);
  const daysAgo = Math.floor((Date.now() - joinedDate.getTime()) / 86400000);
  const when = daysAgo === 0 ? "Today" : daysAgo === 1 ? "1 day ago" : `${daysAgo} days ago`;

  return (
    <div className="flex items-center gap-3 py-3 px-4 border border-gray-100 rounded-xl">
      <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden">
        {member.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatar_url} alt={member.first_name} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-black">{member.first_name}</p>
        <p className="text-xs text-gray-400">
          {member.country_code ? (
            <>{countryFlag(member.country_code)} {COUNTRY_NAMES[member.country_code] ?? member.country_code} · </>
          ) : null}
          Joined {when}
        </p>
      </div>
    </div>
  );
}

function EmptyInvitesState() {
  return (
    <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl">
      <p className="text-sm font-semibold text-gray-700">Your first invitation can start the movement.</p>
      <p className="text-xs text-gray-400 mt-1">Copy your invite link above and share it with someone today.</p>
    </div>
  );
}

function NetworkView({ stats }: { stats: InviteStats | null }) {
  if (!stats) return null;
  const direct = stats.direct_invites;
  const total = stats.total_network;

  return (
    <div className="space-y-4">
      {/* Visual tree */}
      <div className="border border-gray-200 rounded-2xl p-6">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">Your Thank You Network</p>
        <div className="flex items-start gap-4">
          {/* You */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">
              YOU
            </div>
            <div className="w-px h-5 bg-gray-200 mt-1" />
          </div>

          <div className="flex-1 pt-3">
            <div className="flex items-center gap-2 mb-1">
              <ChevronRight size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-black">
                {direct} direct {direct === 1 ? "invite" : "invites"}
              </span>
            </div>
            {total > direct && (
              <div className="flex items-center gap-2 ml-4">
                <ChevronRight size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  {total - direct} more in your network
                </span>
              </div>
            )}
            {direct === 0 && (
              <p className="text-xs text-gray-400 ml-4">
                Invite someone to see your network grow here.
              </p>
            )}
          </div>
        </div>

        {/* Direct invite avatars */}
        {(stats.direct_members?.length ?? 0) > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {stats.direct_members.slice(0, 8).map((m) => (
              <div key={m.id} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 overflow-hidden">
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt={m.first_name} className="w-full h-full object-cover" />
                  ) : (
                    m.first_name[0]?.toUpperCase()
                  )}
                </div>
                <span className="text-[10px] text-gray-500 max-w-[40px] truncate">{m.first_name}</span>
              </div>
            ))}
            {direct > 8 && (
              <div className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-500">
                  +{direct - 8}
                </div>
                <span className="text-[10px] text-gray-500">more</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center py-3">
        <p className="text-xs text-gray-400">
          <span className="font-semibold text-black">You → {direct} direct invites → {total} people</span>
          {" "}in your network
        </p>
      </div>
    </div>
  );
}

function GlobalView({ global }: { global: GlobalStats | null }) {
  if (!global) return null;

  return (
    <div className="space-y-4">
      <div className="border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <Globe2 size={16} className="text-gray-400" />
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Global Movement</p>
        </div>
        <p className="text-3xl font-bold text-black mt-3">
          {(global.total_members).toLocaleString()} people
        </p>
        <p className="text-sm text-gray-500 mt-1">
          across {global.total_countries} {global.total_countries === 1 ? "country" : "countries"}
        </p>
        <p className="text-xs text-gray-400 mt-4 italic">
          This is an aggregate, anonymous view. Personal details are never shared globally.
        </p>
      </div>

      {global.top_countries.length > 0 && (
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Countries</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {global.top_countries.slice(0, 16).map((c) => (
              <div key={c.country_code} className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{countryFlag(c.country_code)}</span>
                  <span className="text-sm font-medium text-gray-800">
                    {COUNTRY_NAMES[c.country_code] ?? c.country_code}
                  </span>
                </div>
                <span className="text-sm font-bold text-black">{c.member_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {global.top_countries.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <MapPin size={20} className="mx-auto mb-2 text-gray-300" />
          Members can set their country in Account settings.
          <br />As they do, the map fills in.
        </div>
      )}
    </div>
  );
}
