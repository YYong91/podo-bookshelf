import type { Book, BookSearchResult } from "../types";
import api from "./client";

interface PaginatedBooks {
  items: Book[];
  total: number;
}

interface GetBooksParams {
  q?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export const getBooks = (params?: GetBooksParams | string) => {
  // 하위 호환: 문자열이면 q로 처리
  const p = typeof params === "string" ? { q: params } : params;
  return api.get<PaginatedBooks>("/books", { params: p }).then((r) => r.data);
};

export const getBook = (id: string) => api.get<Book>(`/books/${id}`).then((r) => r.data);
export const getBookReviews = (id: string) =>
  api.get<import("../types").Review[]>(`/books/${id}/reviews`).then((r) => r.data);
export const toggleFavorite = (id: string) => api.patch<Book>(`/books/${id}/favorite`).then((r) => r.data);

export const createBook = (data: Omit<BookSearchResult, "cover_url"> & { cover_url?: string | null; language?: string }) =>
  api.post<Book>("/books", data).then((r) => r.data);
