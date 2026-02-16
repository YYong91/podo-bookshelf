import type { BookSearchResult } from "../types";
import api from "./client";

export const searchBooks = (q: string, language = "ko", children = true) =>
  api.get<BookSearchResult[]>("/search/books", { params: { q, language, children } }).then((r) => r.data);
