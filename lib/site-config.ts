/**
 * Central site configuration.
 * Update these values when meeting dates, prices, or URLs change.
 * Later these can be pulled from Supabase / a CMS instead of being hardcoded here.
 */

// ─── Book ────────────────────────────────────────────────────────────────────

export const BOOK_TITLE = "365 Thank You.";
export const BOOK_SUBTITLE = "365 days of gratitude, faith, and seeing the future you're believing God for.";
export const BOOK_PRICE = "$20";

/**
 * Replace this placeholder with the real Amazon URL when available.
 * Example: "https://www.amazon.com/dp/XXXXXXXXXX"
 */
export const BOOK_AMAZON_URL = "https://www.amazon.com";

// ─── Membership ───────────────────────────────────────────────────────────────

export const MEMBERSHIP_PRICE = "$99/mo";
export const MEMBERSHIP_FEATURES = [
  "Personal Vision Board",
  "Daily Thank You Streak",
  "Dream Declaration",
  "Private Notes",
  "Community",
  "Monthly Live Calls",
];

// ─── Next Zoom / Live Call ────────────────────────────────────────────────────

/**
 * Set this to the next scheduled live call date.
 * Format: ISO 8601, e.g. "2026-09-06T18:00:00-05:00" (6 PM Central)
 * The countdown bar will count down to this date in real time.
 */
export const NEXT_ZOOM_CALL_DATE = new Date("2026-09-06T18:00:00-05:00");
export const NEXT_ZOOM_CALL_TITLE = "NEXT THANK YOU. LIVE CALL";
export const NEXT_ZOOM_CALL_URL = "https://zoom.us"; // Replace with actual Zoom link
