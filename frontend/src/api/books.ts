import type { Book, Review } from "../types";
import api from "./client";

export const getBooks = (q?: string) => api.get<Book[]>("/books", { params: q ? { q } : {} }).then((r) => r.data);
export const getBook = (id: string) => api.get<Book>(`/books/${id}`).then((r) => r.data);
export const getBookReviews = (id: string) => api.get<Review[]>(`/books/${id}/reviews`).then((r) => r.data);
export const toggleFavorite = (id: string) => api.patch<Book>(`/books/${id}/favorite`).then((r) => r.data);
