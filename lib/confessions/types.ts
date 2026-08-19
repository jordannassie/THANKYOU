export interface Confession {
  id: string;
  confession_text: string;
  scripture_reference: string;
  sort_order: number;
}

export interface ConfessionRow extends Confession {
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

/** Local calendar date as YYYY-MM-DD */
export function localTodayStr(): string {
  return new Date().toLocaleDateString("en-CA");
}
