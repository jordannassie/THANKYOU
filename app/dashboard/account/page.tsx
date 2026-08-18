"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Crown, LogOut, Loader2 } from "lucide-react";
import { useUser } from "@/components/providers/UserProvider";
import { getInitials, getFirstName } from "@/lib/types";
import { signOut } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { mockMembership, mockPreferences } from "@/lib/mock-data";
import { MEMBERSHIP_FEATURES, MEMBERSHIP_PRICE } from "@/lib/site-config";

export default function AccountPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);

  const { isDemo } = useUser();

  const [name, setName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [prefs, setPrefs] = useState(mockPreferences);

  const initials = getInitials(profile, user?.email);
  const firstName = getFirstName(profile, user?.email);
  const email = user?.email ?? profile?.email ?? "";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setSaveError("");
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setSaveError(error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleAvatarClick = () => fileRef.current?.click();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      setUploadError("Sign in to upload a profile photo.");
      return;
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }

    setUploading(true);
    setUploadError("");

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: storageError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (storageError) {
      setUploadError(`Upload failed: ${storageError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    if (dbError) {
      setUploadError(`Profile update failed: ${dbError.message}`);
    } else {
      setAvatarUrl(publicUrl);
    }
    setUploading(false);
  };

  const togglePref = (key: keyof typeof mockPreferences) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  const isPremium = profile?.membership_status === "premium";

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your profile, membership, and preferences.</p>
      </div>

      {/* Demo notice */}
      {isDemo && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm text-gray-500">
          You are viewing a <strong className="text-black">demo account</strong>. Sign in to save changes and upload a profile photo.
        </div>
      )}

      {/* Profile */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-semibold mb-5">Profile</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <button
              onClick={handleAvatarClick}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
              title="Change photo"
            >
              {uploading ? <Loader2 size={9} className="animate-spin" /> : <Camera size={11} />}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{firstName}</p>
            <p className="text-xs text-gray-400">Member since {memberSince}</p>
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
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
              title="Email is managed through Supabase Auth"
            />
            <p className="text-xs text-gray-400 mt-1">Email changes are managed through account security.</p>
          </div>
          {uploadError && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{uploadError}</p>
          )}
          {saveError && (
            <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{saveError}</p>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving || isDemo}
            className="w-full bg-black text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
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
            <h2 className="text-base font-semibold">
              {isPremium ? "Premium Membership" : "Free Account"}
            </h2>
            <p className="text-sm text-gray-500">
              {isPremium ? `${MEMBERSHIP_PRICE} · Active` : "Upgrade to unlock everything"}
            </p>
          </div>
        </div>
        <ul className="space-y-1.5 mb-5">
          {(isPremium ? MEMBERSHIP_FEATURES : mockMembership.features).map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPremium ? "bg-black" : "bg-gray-300"}`} />
              {f}
            </li>
          ))}
        </ul>
        <button className="w-full border border-gray-200 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
          {isPremium ? "Manage Membership" : "Upgrade to Premium"}
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
            description="Get notified before your monthly live call"
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

      {/* Account Actions */}
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
