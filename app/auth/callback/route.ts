import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/dashboard";
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (errorParam) {
    const msg = errorDescription ?? errorParam;
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(msg)}`
    );
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && sessionData?.user) {
      const userId = sessionData.user.id;

      // ── Referral attribution ───────────────────────────────────
      // Check for a pending referral code in the cookie.
      const refCookie = cookieStore.get("ty_ref_code");
      const refCode = refCookie?.value;

      if (refCode) {
        try {
          // Fire-and-forget: attribute the referral server-side.
          // Use the internal key (first 32 chars of service role key) to authenticate.
          const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
          await fetch(`${requestUrl.origin}/api/invite/attribute`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-key": serviceKey.slice(0, 32),
            },
            body: JSON.stringify({
              invited_user_id: userId,
              invite_code: decodeURIComponent(refCode),
            }),
          });
        } catch (e) {
          // Non-fatal: log and continue
          console.error("[callback] referral attribution error:", e);
        }

        // Clear the referral cookie regardless
        cookieStore.set("ty_ref_code", "", { path: "/", maxAge: 0 });
      }

      // Always redirect to /dashboard after successful auth
      const redirectTo = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error?.message ?? "Auth failed")}`
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=${encodeURIComponent("No auth code received. Please try again.")}`
  );
}
