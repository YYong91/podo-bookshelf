import type { PaginatedReviews, Review, ReviewCreateWithBook } from "../types";
import api from "./client";

type ReviewWithTotal = Review & { total_reviews?: number };

export const getReviews = (params?: { q?: string; language?: string; favorite?: boolean; page?: number; size?: number }) =>
  api.get<PaginatedReviews>("/reviews", { params }).then((r) => r.data);
export const getReview = (id: string) => api.get<Review>(`/reviews/${id}`).then((r) => r.data);
export const createReview = (data: { book_id: string; read_date: string; memo: string; child_reaction: string; activity: string }) =>
  api.post<ReviewWithTotal>("/reviews", data).then((r) => r.data);
export const createReviewWithBook = (data: ReviewCreateWithBook) =>
  api.post<ReviewWithTotal>("/reviews/with-book", data).then((r) => r.data);
export const updateReview = (id: string, data: Partial<Review>) =>
  api.put<Review>(`/reviews/${id}`, data).then((r) => r.data);
export const deleteReview = (id: string) => api.delete(`/reviews/${id}`);
