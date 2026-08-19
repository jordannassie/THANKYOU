/**
 * Central site configuration.
 * Update these values when meeting dates, prices, or URLs change.
 * Later these can be pulled from Supabase / a CMS instead of being hardcoded here.
 */

// ─── Books ───────────────────────────────────────────────────────────────────

export interface SiteBook {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  coverUrl: string;
  amazonUrl: string;
}

export const BOOKS: SiteBook[] = [
  {
    id: "thank-you",
    title: "365 Thank You.",
    subtitle: "365 days of gratitude, faith, and seeing the future you're believing God for.",
    price: "$20",
    coverUrl: "https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Booksmall.png",
    amazonUrl: "https://www.amazon.com",
  },
  {
    id: "with-jesus-daily",
    title: "With Jesus Daily",
    subtitle: "365 days with Jesus — a daily Christian devotional to grow your faith one day at a time.",
    price: "$20",
    coverUrl: "https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/jordandaily.jpg",
    amazonUrl: "https://www.amazon.com/Jesus-Daily-365-Christian-Devotional/dp/B0F8VJ3KBV",
  },
];

/** @deprecated Use BOOKS[0] — kept for existing imports */
export const BOOK_TITLE = BOOKS[0].title;
export const BOOK_SUBTITLE = BOOKS[0].subtitle;
export const BOOK_PRICE = BOOKS[0].price;
export const BOOK_AMAZON_URL = BOOKS[0].amazonUrl;

export const AMAZON_LOGO_URL =
  "https://stkjiamytlocpeuhwtek.supabase.co/storage/v1/object/public/STORAGE/images/logos/Amazon_logo.svg.webp";

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
