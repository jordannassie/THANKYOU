"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Crown, LogOut } from "lucide-react";
import { mockUser, mockMembership, mockPreferences } from "@/lib/mock-data";
import { signOut } from "@/lib/auth";

export default function AccountPage() {
  const router = useRouter();
  const [name, setName] = useState(mockUser.name);
  const [email, setEmail] = useState(mockUser.email);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState(mockPreferences);

  const handleSaveProfile = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const togglePref = (key: keyof typeof mockPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    signOut();
    router.push("/login");
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile, membership, and preferences.</p>
      </div>

      {/* Profile */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
              <img
                src={mockUser.avatar}
                alt={mockUser.name}
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors">
              <Camera size={11} />
            </button>
          </div>
          <div>
            <p className="text-sm font-semibold">{mockUser.name}</p>
            <p className="text-xs text-gray-400">Member since {mockUser.joinedDate}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Membership */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center">
            <Crown size={15} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Premium Membership</h2>
            <p className="text-sm text-gray-500">{mockMembership.price} · Active</p>
          </div>
        </div>
        <ul className="space-y-1.5 mb-5">
          {mockMembership.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0" />
              {f}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mb-4">
          Next billing date: {mockMembership.nextBillingDate}
        </p>
        <button className="w-full border border-gray-200 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          Manage Membership
        </button>
      </section>

      {/* Preferences */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Preferences</h2>
        <div className="space-y-4">
          <PreferenceToggle
            label="Email Notifications"
            description="Receive updates and encouragement by email"
            checked={prefs.emailNotifications}
            onChange={() => togglePref("emailNotifications")}
          />
          <PreferenceToggle
            label="Weekly Call Reminders"
            description="Get notified before your weekly Zoom call"
            checked={prefs.weeklyCallReminders}
            onChange={() => togglePref("weeklyCallReminders")}
          />
          <PreferenceToggle
            label="Daily Thank You Reminder"
            description="A daily nudge to stay consistent with your gratitude"
            checked={prefs.dailyThankYouReminder}
            onChange={() => togglePref("dailyThankYouReminder")}
          />
        </div>
      </section>

      {/* Logout */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-4">Account</h2>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </section>
    </div>
  );
}

function PreferenceToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{description}</p>
      </div>
      <label className="toggle-switch shrink-0 ml-4">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="toggle-slider" />
      </label>
    </div>
  );
}
