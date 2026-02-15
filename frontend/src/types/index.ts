export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  isbn: string | null;
  publisher: string | null;
  created_at: string;
  review_count: number;
}

export interface Review {
  id: string;
  book_id: string;
  read_date: string;
  memo: string;
  child_reaction: string;
  created_at: string;
  updated_at: string | null;
  book: Book;
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
}

export interface ReviewCreateWithBook {
  title: string;
  author: string;
  cover_url?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  read_date: string;
  memo: string;
  child_reaction: string;
}
