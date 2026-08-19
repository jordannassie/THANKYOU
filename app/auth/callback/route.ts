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
        cookieOptions: {
          maxAge: 60 * 60 * 24 * 365,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        },
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

      // ── Referral attribution ───────────────────────────────────────────
      const refCookie = cookieStore.get("ty_ref_code");
      const refCode = refCookie?.value;

      if (refCode) {
        try {
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
          console.error("[callback] referral attribution error:", e);
        }
        cookieStore.set("ty_ref_code", "", { path: "/", maxAge: 0 });
      }

      const redirectTo = next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`);
    }

    // ── Error handling ───────────────────────────────────────────────────
    const errMsg = error?.message ?? "Authentication failed";

    // PKCE verifier missing → user opened the link in a different browser.
    // Give them a clear, actionable message instead of a cryptic Supabase error.
    if (errMsg.toLowerCase().includes("pkce") || errMsg.toLowerCase().includes("code verifier")) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(
          "The sign-in link was opened in a different browser. Please sign in directly below."
        )}`
      );
    }

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errMsg)}`
    );
  }

  return NextResponse.redirect(
    `${requestUrl.origin}/login?error=${encodeURIComponent(
      "No auth code received. Please try again."
    )}`
  );
}
