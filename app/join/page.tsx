"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function JoinRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[a-z0-9]{4,32}$/i.test(ref)) {
      document.cookie = `ty_ref_code=${encodeURIComponent(ref)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
    router.replace("/login");
  }, [searchParams, router]);

  return null;
}

export default function JoinPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Suspense fallback={null}>
        <JoinRedirect />
      </Suspense>
      <p className="text-gray-400 text-sm">Redirecting…</p>
    </div>
  );
}
