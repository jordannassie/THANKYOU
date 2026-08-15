/**
 * Mock authentication layer.
 * Replace these functions with Supabase Auth calls when backend is ready.
 * The UI should never directly access localStorage — always go through this module.
 */

const MOCK_USER_KEY = "thankyou_mock_user";
const DEMO_USER_KEY = "thankyou_demo_user";

export function signIn(email: string, _password: string): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (email) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DEMO_USER_KEY);
          localStorage.setItem(MOCK_USER_KEY, JSON.stringify({ email, signedInAt: Date.now() }));
        }
        resolve({ success: true });
      } else {
        resolve({ success: false, error: "Invalid credentials" });
      }
    }, 600);
  });
}

export function signUp(
  name: string,
  email: string,
  _password: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (name && email) {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DEMO_USER_KEY);
          localStorage.setItem(MOCK_USER_KEY, JSON.stringify({ name, email, signedInAt: Date.now() }));
        }
        resolve({ success: true });
      } else {
        resolve({ success: false, error: "Please fill in all fields" });
      }
    }, 600);
  });
}

/**
 * Demo access — populates the dashboard with sample content immediately.
 * No email or password required.
 * Easy to remove when real auth is added: just delete this function and its call site.
 */
export function signInAsDemo(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_USER_KEY, "true");
    localStorage.setItem(
      MOCK_USER_KEY,
      JSON.stringify({ name: "Jordan", email: "demo@thankyou.app", isDemo: true, signedInAt: Date.now() })
    );
  }
}

export function isDemoUser(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_USER_KEY) === "true";
}

export function signOut(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(MOCK_USER_KEY);
    localStorage.removeItem(DEMO_USER_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(MOCK_USER_KEY);
}

export function getCurrentUser(): { email?: string; name?: string; isDemo?: boolean } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
