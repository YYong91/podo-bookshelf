export interface Book {
  id: string;
  user_id: string | null;
  title: string;
  author: string;
  cover_url: string | null;
  isbn: string | null;
  publisher: string | null;
  language: string | null;
  is_favorite: boolean;
  created_at: string;
  review_count: number;
}

export interface Review {
  id: string;
  book_id: string;
  user_id: string | null;
  read_date: string;
  memo: string;
  activity: string;
  tags: string[];
  child_age_months: number | null;
  created_at: string;
  updated_at: string | null;
  book: Book;
}

export interface PaginatedReviews {
  items: Review[];
  total: number;
  page: number;
  size: number;
}

export interface GardenStats {
  total_reviews: number;
  grapes: number;
  bunches: number;
  trees: number;
}

export interface BookSearchResult {
  title: string;
  author: string;
  publisher: string;
  cover_url: string;
  isbn: string | null;
  language: string;
}

export interface IsbnLookupResult {
  source: "local" | "google";
  book: Book | BookSearchResult;
}

export interface ReviewCreateWithBook {
  title: string;
  author: string;
  cover_url?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  language?: string | null;
  read_date: string;
  memo: string;
  activity: string;
  child_age_months?: number | null;
}
