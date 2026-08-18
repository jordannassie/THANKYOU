"use client";

export default function ExitAdminButton() {
  const handleExit = () => {
    document.cookie = "ty_admin_code=; path=/; max-age=0";
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleExit}
      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-white/30 hover:text-white/60 hover:bg-white/10 rounded-xl transition-colors"
    >
      Exit Admin
    </button>
  );
}
