import type { BookSearchResult } from "../types";
import api from "./client";

export const searchBooks = (q: string, language = "ko") =>
  api.get<BookSearchResult[]>("/search/books", { params: { q, language } }).then((r) => r.data);
