import type { BookSearchResult } from "../types";
import api from "./client";

export const searchBooks = (q: string) =>
  api.get<BookSearchResult[]>("/search/books", { params: { q } }).then((r) => r.data);
