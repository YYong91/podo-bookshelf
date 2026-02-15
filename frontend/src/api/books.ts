import type { Book } from "../types";
import api from "./client";

export const getBooks = () => api.get<Book[]>("/books").then((r) => r.data);
export const getBook = (id: string) => api.get<Book>(`/books/${id}`).then((r) => r.data);
