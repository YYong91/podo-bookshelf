import type { PaginatedReviews, Review, ReviewCreateWithBook } from "../types";
import api from "./client";

export const getReviews = (params?: { q?: string; language?: string; page?: number; size?: number }) =>
  api.get<PaginatedReviews>("/reviews", { params }).then((r) => r.data);
export const getReview = (id: string) => api.get<Review>(`/reviews/${id}`).then((r) => r.data);
export const createReviewWithBook = (data: ReviewCreateWithBook) =>
  api.post<Review>("/reviews/with-book", data).then((r) => r.data);
export const updateReview = (id: string, data: Partial<Review>) =>
  api.put<Review>(`/reviews/${id}`, data).then((r) => r.data);
export const deleteReview = (id: string) => api.delete(`/reviews/${id}`);
