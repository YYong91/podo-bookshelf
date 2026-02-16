import type { BookSearchResult, IsbnLookupResult } from "../types";
import api from "./client";

export const searchBooks = (q: string) =>
  api.get<BookSearchResult[]>("/search/books", { params: { q } }).then((r) => r.data);

export const searchBookByIsbn = (isbn: string) =>
  api.get<IsbnLookupResult>(`/search/books/isbn/${isbn}`).then((r) => r.data);
