export interface Affirmation {
  id: string;
  affirmation_text: string;
  scripture_reference: string;
  sort_order: number;
}

export interface AffirmationRow extends Affirmation {
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/** Local calendar date as YYYY-MM-DD */
export function localTodayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}
