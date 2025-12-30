export interface Paste {
  content: string;
  created_at: number;
  ttl_seconds: number | null;
  max_views: number | null;
  view_count: number;
}

export interface PasteData {
  content: string;
  remaining_views: number | null;
  expires_at: string | null;
}

export type CreatePasteBody = {
  content: string;
  ttl_seconds?: number;
  max_views?: number;
};
